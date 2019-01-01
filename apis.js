const request = require("request-promise");

module.exports = {
  getPois: (location, radius, type, callback) => {
    request({
      uri: process.env.GOOGLE_PLACES_URL,
      qs: {
        location: `${location.lat},${location.lng}`,
        radius: radius,
        type: type,
        name: type,
        key: process.env.GOOGLE_API_KEY
      },
      json: true
    }).then(resp => {
      callback(resp.results);
    });
  },
  getDetails: (placeid, callback) => {
    request({
      uri: process.env.GOOGLE_PLACES_DETAILS_URL,
      qs: {
        placeid: placeid,
        key: process.env.GOOGLE_API_KEY
      },
      json: true
    }).then(resp => {
      var poi = resp.result;
      poi.location = poi.geometry.location;
      delete poi.geometry;
      delete poi.address_components;
      delete poi.adr_address;
      delete poi.photos;
      delete poi.reference;
      delete poi.reviews;
      delete poi.scope;
      delete poi.types;
      poi.expected_time = getExpectedTime();
      //adjust opening hours
      try {
        const periods = poi.opening_hours.periods;
        var newPeriods = new Array(7);
        for (var i in periods) {
          newPeriods[periods[i].open.day] = {
            open: periods[i].open.time,
            close: periods[i].close.time
          };
        }
        poi.opening_hours.periods = newPeriods;
      } catch (err) {}
      callback(poi);
    });
  },
  getTimeMatrix: function(pois, key, callback) {
    var matrix = [new Array(pois.length)];
    var promises = [];
    for (var i = 0; i < pois.length - 1; i++) {
      matrix.push(new Array(pois.length));
      for (var j = i + 1; j < pois.length; j++) {
        promises.push(
          new Promise(resolve => {
            getRoute(
              key,
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
    Promise.all(promises).then(values => {
      var ind = 0;
      for (var i = 0; i < pois.length - 1; i++) {
        for (var j = i + 1; j < pois.length; j++) {
          matrix[i][j] = values[ind];
          matrix[j][i] = values[ind];
          ind++;
        }
      }
      callback(matrix);
    });
  }
};

function getRoute(key, origin, destination, callback) {
  request({
    uri: process.env.GOOGLE_DIRECTIONS_URL,
    qs: {
      origin: origin,
      destination: destination,
      units: "metric",
      mode: "walking",
      key: key
    },
    json: true
  }).then(resp => {
    const route = resp.routes[0];
    obj = {
      // distance:route.legs[0].distance.value, TODO find out why this
      duration: route.legs[0].duration.value / 60,
      points: route.overview_polyline.points
    };

    callback(obj);
  });
}
function getExpectedTime() {
  return Math.ceil(Math.random() * 60 + 30);
}
