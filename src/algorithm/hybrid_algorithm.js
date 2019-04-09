const KmeansLib = require("kmeans-same-size");
const kmeans = new KmeansLib();
const api = require("../api/google_api");
const { of, from, forkJoin } = require("rxjs");
const { GeneticAlgorithm } = require("ga-tsp");
const { get } = require("lodash");
const moment = require("moment");
const {
  map,
  mergeMap,
  reduce,
  concatMap,
  scan,
  takeWhile,
  switchMap
} = require("rxjs/operators");

require("dotenv").config();

function main(userInfo) {
  const start_date = moment(userInfo.startDate, "YYYY-MM-DD");

  return getPois(userInfo.location, userInfo.categories).pipe(
    switchMap(pois => getClusters(pois, userInfo.totalDays)),
    concatMap(clusters => from(clusters)),
    mergeMap((cluster, index) => {
      const travel_date = start_date.clone().add(index, "day");

      return forkJoin(getDetails(cluster, travel_date), of(travel_date));
    }),
    concatMap(([pois, travel_date]) =>
      getTour([{ location: userInfo.location }, ...pois], userInfo, travel_date)
    ),
    concatMap(tour => forkJoin(of(tour), getRestaurants(tour))),
    reduce(
      (acc, [tour, restaurants]) => [
        ...acc,
        {
          tour,
          restaurants
        }
      ],
      []
    )
  );
}

function getPois(location, categories) {
  return from(categories).pipe(
    mergeMap(category => api.getPois(location, 3000, category)),
    reduce((acc, curr) => [...acc, ...curr], [])
  );
}

function getClusters(pois, totalDays) {
  return of(
    pois.map(poi => ({
      ...poi,
      x: poi.location.lat,
      y: poi.location.lng
    }))
  ).pipe(
    map(mapped_pois => {
      kmeans.init({
        k: totalDays,
        runs: ~~(mapped_pois.length / totalDays),
        equalSize: true,
        normalize: false
      });
      kmeans.calc(mapped_pois);

      return mapped_pois;
    }),
    concatMap(pois => from(pois)),
    reduce((clusters, poi) => {
      const index = poi.k;
      delete poi.k;
      delete poi.x;
      delete poi.y;

      clusters[index].push(poi);

      return clusters;
    }, Array.from(Array(totalDays), _ => [])),
    concatMap(clusters => from(clusters)),
    map(cluster => cluster.sort((a, b) => b.rating - a.rating)),
    reduce((clusters, cluster) => [...clusters, cluster], [])
  );
}

function getDetails(cluster, travelDate) {
  return from(cluster).pipe(
    concatMap(poi => api.getDetails(poi.place_id)),
    // filter(poi => get(poi, `opening_hours.periods[${travelDate.day()}]`) !== undefined), TODO: uncomment this in case of using another API
    scan((new_cluster, x) => [...new_cluster, x], []),
    takeWhile(new_cluster => new_cluster.length <= 7),
    reduce((_, new_cluster) => new_cluster)
  );
}

function getTour(pois, userInfo, travelDate) {
  return api.getTimeMatrix(pois).pipe(
    map(matrix => {
      const ga = new GeneticAlgorithm({
        pois,
        timeMatrix: matrix,
        travelDate: travelDate.toDate(),
        travelSchedule: userInfo.travelSchedule,
        lunchTime: userInfo.lunchTime,
        totalGenerations: 100 * pois.length,
        populationSize: pois.length ** 2, // TODO: averiguar bien
        crossOverProbability: 1 / 3,
        mutationProbability: 0.05
      });

      const tour = ga.evolve();
      let last_index = tour.findIndex(
        event =>
          Number(get(event, "schedule.start", "").replace(":", "")) >=
          Number(userInfo.travelSchedule.end)
      );

      if (last_index === -1) return tour;

      last_index =
        tour[last_index].type === "poi" ? last_index + 1 : last_index;

      return tour.slice(0, last_index);
    })
  );
}

function getRestaurants(tour) {
  const lunch_index = tour.findIndex(poi => poi.type === "lunch");

  if (lunch_index === -1) return of([]);

  const location =
    tour[lunch_index - 1].type === "poi"
      ? tour[lunch_index - 1].location
      : tour[lunch_index + 1].location;

  return api.getPois(location, 500, "restaurant").pipe(
    map(results =>
      results
        .map(restaurant => ({
          ...restaurant,
          schedule: tour[lunch_index].schedule
        }))
        .slice(0, 5)
    )
  );
}

module.exports = {
  main,
  getPois,
  getClusters,
  getDetails,
  getTour
};
