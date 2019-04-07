const rp = require("request-promise");
const { of, from } = require("rxjs");
const { map, concatMap, reduce } = require("rxjs/operators");
const dot = require("dot-object");

module.exports = {
  getPois: (location, radius, type) =>
    from(
      rp.get({
        uri: process.env.GOOGLE_PLACES_URL,
        qs: {
          location: `${location.lat},${location.lng}`,
          radius: radius,
          type: type,
          name: type,
          key: process.env.GOOGLE_API_KEY
        },
        json: true
      })
    ).pipe(
      concatMap(resp => from(resp.results)),
      map(poi => {
        dot.move("geometry.location", "location", poi);

        return poi;
      }),
      reduce((pois, poi) => [...pois, poi], [])
    ),
  getDetails: placeid =>
    from(
      rp.get({
        uri: process.env.GOOGLE_PLACES_DETAILS_URL,
        qs: {
          placeid: placeid,
          key: process.env.GOOGLE_API_KEY
        },
        json: true
      })
    ).pipe(
      map(resp => {
        const poi = resp.result;

        dot.move("geometry.location", "location", poi);
        delete poi.geometry;
        delete poi.address_components;
        delete poi.adr_address;
        delete poi.photos;
        delete poi.reference;
        delete poi.reviews;
        delete poi.scope;
        delete poi.types;
        poi.expected_time = _getExpectedTime();
        //adjust opening hours
        try {
          const periods = [...poi.opening_hours.periods];
          const newPeriods = new Array(7);

          for (let period of periods) {
            newPeriods[period.open.day] = {
              open: period.open.time,
              close: period.close.time
            };
          }
          poi.opening_hours.periods = newPeriods;
        } catch (_) {}

        return poi;
      })
    ),
  getTimeMatrix: pois => {
    const matrix = [new Array(pois.length)];
    const promises = [];

    for (let i = 0; i < pois.length - 1; i++) {
      matrix.push(new Array(pois.length));
      for (let j = i + 1; j < pois.length; j++) {
        promises.push(
          new Promise(resolve => {
            _getRoute(
              i === 0
                ? `${pois[i].location.lat},${pois[i].location.lng}`
                : `place_id:${pois[i].place_id}`,
              `place_id:${pois[j].place_id}`,
              route => {
                resolve(route);
              }
            );
          })
        );
      }
    }

    return from(Promise.all(promises)).pipe(
      map(values => {
        let ind = 0;
        for (let i = 0; i < pois.length - 1; i++) {
          for (let j = i + 1; j < pois.length; j++) {
            matrix[i][j] = values[ind];
            matrix[j][i] = values[ind];
            ind++;
          }
        }
        return matrix;
      })
    );
  }
};

function _getRoute(origin, destination, callback) {
  rp.get({
    uri: process.env.GOOGLE_DIRECTIONS_URL,
    qs: {
      origin: origin,
      destination: destination,
      units: "metric",
      mode: "walking",
      key: process.env.API_KEY_MATRIX
    },
    json: true
  }).then(resp => {
    const route = resp.routes[0];

    callback({
      duration: route.legs[0].duration.value / 60,
      points: route.overview_polyline.points
    });
  });
}

function _getExpectedTime() {
  return Math.ceil(Math.random() * 60 + 30);
}
