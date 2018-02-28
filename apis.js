const request = require('request-promise');

module.exports = {
    getPois: function (location,type,callback) {
        request(
            {
                uri:'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
                qs: {
                    location: `${location.lat},${location.lng}`,
                    radius:2000,
                    type:type,
                    name:type,
                    key:'AIzaSyD4qbkCAmjG4kObzEXT9gnzPGHel3Tuk44'
                },
                json: true
            }).then(function (resp) {
                    callback(resp.results);
            });
    },
    getDetails: function (placeid,callback) {
        request(
            {
                uri:'https://maps.googleapis.com/maps/api/place/details/json',
                qs: {
                    placeid: placeid,
                    key:'AIzaSyD4qbkCAmjG4kObzEXT9gnzPGHel3Tuk44'
                },
                json: true
            }).then(function (resp) {
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
                delete poi.types;
                poi.expected_time = getExpectedTime();
                callback(poi);
            });
    },
    getMatrix: function (pois,callback) {
        var matrix = [new Array(pois.length)];
        var promises = [];
        for(var i=0; i<pois.length-1; i++){
            matrix.push(new Array(pois.length));
            for(var j=i+1; j<pois.length; j++){
                promises.push(new Promise(function (resolve) {
                        request(
                            {
                                uri:'https://maps.googleapis.com/maps/api/directions/json',
                                qs: {
                                    origin: `place_id:${pois[i].place_id}`,
                                    destination:`place_id:${pois[j].place_id}`,
                                    units:'metric',
                                    mode:'walking',
                                    key:'AIzaSyBjLWzGBsWZIBwBNVMCqXbjwFEzNfomR0k'
                                },
                                json: true
                            }).then(function (resp) {
                            const route=resp.routes[0];
                            obj = {
                                distance:route.legs[0].distance.value,
                                duration:route.legs[0].duration.value / 60,
                                points:route.overview_polyline.points
                            };
                            resolve(obj);
                        });
                    })
                );
            }
        }
        Promise.all(promises).then(function (values) {
           var ind = 0;
           for(var i=0; i<pois.length-1; i++){
                for(var j=i+1; j<pois.length; j++){
                    matrix[i][j]=values[ind];
                    matrix[j][i]=values[ind];
                    ind++;
                }
            }
            callback(matrix);
        });
    }
};

function getExpectedTime() {
    return Math.ceil(Math.random()*60+30);
}
