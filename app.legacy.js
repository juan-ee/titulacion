const ga = require("ga-tsp");
const KmeansLib = require("kmeans-same-size");
const kmeans = new KmeansLib();
const express = require("express");
const appLegacy = express();
const api = require("./src/api/google_api");
const CircularJSON = require("circular-json");
const { of, from } = require("rxjs");
const { map, filter, mergeMap, reduce, concatMap } = require("rxjs/operators");

require("dotenv").config();
const bodyParser = require("body-parser");
// const fs = require('fs');

appLegacy.set("view engine", "ejs");
appLegacy.use(bodyParser.json()); // support json encoded bodies
appLegacy.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

appLegacy.use(express.static("public"));

appLegacy.listen(8080);

appLegacy.get("/pois", (req, res) => {
  const userInfo = req.query;
  let promises = [];
  userInfo.location = {
    lat: parseFloat(userInfo.location.lat),
    lng: parseFloat(userInfo.location.lng)
  };
  for (let i in userInfo.categories) {
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
  Promise.all(promises).then(pois => {
    //---------TODO RESOLVER ESTO--------
    pois.sort((a, b) => b.rating - a.rating);
    pois = pois.slice(0, userInfo.days * 6);
    //-------------------------------
    getDetails(pois, pois_details => {
      if (pois_details.length < userInfo.days) {
        res.json("Not enough points of interest for your preferences.");
        return;
      }
      _getClusters(pois_details, userInfo.days, clusters => {
        getTours(clusters, userInfo.location, tours => {
          getRestaurants(tours, restaurants => {
            res.render("map", { array: tours, restaurants: restaurants });
          });
        });
      });
    });
  });
});