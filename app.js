const ga = require("ga-tsp");
const KmeansLib = require("kmeans-same-size");
const kmeans = new KmeansLib();
const express = require("express");
const app = express();
const api = require("./apis");
const CircularJSON = require('circular-json');
require("dotenv").config();
// const bodyParser = require('body-parser');
// const fs = require('fs');

app.set("view engine", "ejs");
// app.use(bodyParser.json()); // support json encoded bodies
// app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(express.static("public"));

app.listen(8080);

app.get("/pois", (req, res) => {
  const userInfo = req.query;
  var pois = [];
  var promises = [];
  userInfo.location = {
    lat: parseFloat(userInfo.location.lat),
    lng: parseFloat(userInfo.location.lng)
  };
  for (var i in userInfo.categories) {
    promises.push(
      new Promise(resolve => {
        api.getPois(
          userInfo.location,
          2000,
          userInfo.categories[i],
          results => {
            resolve(results);
          }
        );
      })
    );
  }
  Promise.all(promises).then(results => {
    pois = pois.concat.apply(pois, results);
    //---------TODO RESOLVER ESTO--------
    pois.sort((a, b) => b.rating - a.rating);
    pois = pois.slice(0, userInfo.days * 6);
    //-------------------------------
    getDetails(pois, pois_details => {
      if (pois_details.length < userInfo.days) {
        res.json("Not enough points of interest for your preferences.");
        return;
      }
      getClusters(pois_details, userInfo.days, clusters => {
        getTours(clusters, userInfo.location, tours => {
          getRestaurants(tours, restaurants => {
            res.render("map", { array: tours, restaurants: restaurants });
          });
        });
      });
    });
  });
});

function getDetails(pois, callback) {
  var promises = [];
  for (var i in pois) {
    if (pois[i].rating !== undefined) {
      promises.push(
        new Promise(resolve => {
          api.getDetails(pois[i].place_id, result => {
            resolve(result);
          });
        })
      );
    }
  }
  Promise.all(promises).then(pois => {
    callback(pois);
  });
}

function getClusters(pois, days, callback) {
  //ordenar de menor a mayor PILAS, de acuerdo al tiempo
  const clusters = new Array(days);

  // ver luego lo de Location
  pois = pois.map(poi => ({...poi,
    x: poi.location.lat,
    y: poi.location.lng
  }));

  kmeans.init({
    k: days,
    runs: ~~(pois.length / days),
    equalSize: true,
    normalize: false
  });
  kmeans.calc(pois);

  // group in clusters
  for (let poi of pois) {
    const index = poi.k;
    delete poi.k;
    delete poi.x;
    delete poi.y;
    try {
      clusters[index].push(poi);
    } catch (_) {
      clusters[index] = [];
      clusters[index].push(poi);
    }
  }
  callback(clusters);
}

function getTours(clusters, userLocation, callback) {
  var tours = [];
  var promises = [];
  var n = -1;
  const keys = [
    "AIzaSyAgg8nvSsVsJo_fOvJB0113sJ9saV6BgEo",
    "AIzaSyDZJ4eK77EVxoJsUIzqUZMJgpmxJsFQvyo",
    "AIzaSyCfqVM0MdOINSwxu_n9Sy_nYzs29-La-zE",
    "AIzaSyBjLWzGBsWZIBwBNVMCqXbjwFEzNfomR0k"
  ];

  clusters.forEach((cluster, index, clusters) => {
    n++;
    n = n === keys.length ? 0 : n;

    //--------RESOLVER ESTO LUEGO---------
    // clusters[index] = cluster.slice(0,6);
    clusters[index].unshift({ location: userLocation });
    //------------------------------------
    promises.push(
      new Promise(resolve => {
        api.getTimeMatrix(clusters[index], process.env.API_KEY_MATRIX, matrix => {
          resolve(matrix);
        });
      })
    );
  });

  Promise.all(promises).then(matrixes => {
    //quitar esto
    // fs.appendFileSync('matrixes.txt', `\n--SOLICITUD--`);
    // fs.appendFileSync('matrixes.txt', `\n--clusters-\n${JSON.stringify(clusters)}\n-------\n`);
    // fs.appendFileSync('matrixes.txt', `\n--matrixes--\n${JSON.stringify(matrixes)}\n-------\n`);

    // ------------resolver de acuerdo a las fechas escogidas-------------
    var date = new Date(
      new Date()
        .toDateString()
        .split(" ")
        .splice(1, 3)
        .join(" ") + " 10:00:00"
    );
    //----------------------------------------------------------------
    for (var i in matrixes) {
      // TODO: pilas, ver si la puta MATRIZ se construye bien
      // console.log('[POIS]', CircularJSON.stringify(clusters[i]));
      // console.log('[MATRIX]', CircularJSON.stringify(matrixes[i]));
      date.setDate(date.getDate() + 1);
      const parameters = {
        pois: clusters[i],
        date: date,
        timeMatrix: matrixes[i],
        mutation_rate: 0.03,
        sizePopulation: clusters[i].length * clusters[i].length,
        totalGenerations: 10 * clusters[i].length
      };
      tours.push(ga.evolve(parameters));
    }
    callback(tours);
  });
}

function getRestaurants(tours, callback) {
  promises = [];
  tours.forEach(tour => {
    tour.forEach((value, index, array) => {
      if (value.lunch) {
        promises.push(
          new Promise(resolve => {
            api.getPois(value.location, 100, "restaurant", result => {
              if (result.length > 0) {
                result.map(restaurant => {
                  restaurant.time = `${value.start} - ${value.end}`;
                  return restaurant;
                });
                resolve(result.splice(0, 5));
              } else {
                api.getPois(
                  array[array.indexOf(value) - 2].poi.location,
                  100,
                  "restaurant",
                  result => {
                    result.map(restaurant => {
                      restaurant.time = `${value.start} - ${value.end}`;
                      return restaurant;
                    });
                    resolve(result.splice(0, 5));
                  }
                );
              }
            });
          })
        );
      }
    });
  });
  Promise.all(promises).then(restaurants => {
    callback([].concat.apply([], restaurants));
  });
}

// app.get('/params', function (req, res) { //query params
//     // ?order=desc&shoe[color]=blue&shoe[type]=converse   => { order: 'desc', shoe: { color: 'blue', type: 'converse' } }
//     var color = req.query.color;
//     res.send('color: '+color+'\n'+req.query);
// });
//
// app.get('/id/:id', function (req, res) { //route params
//     res.send('id: '+req.params.id);
// });
//
//
// app.param('id', function(req, res, next, name) { //midleware
//     var modified = name + '-dude';
//
//     // save name to the request
//     req.name = modified;
//
//     next();
// });
// app.get('/pois', function (req, res) { //?location[lat]=40.765068&location[lng]=-73.987452&days=3&categories[]=museum&categories[]=church&categories[]=park
//     const userInfo = req.query;
//     res.json(userInfo);
// });

