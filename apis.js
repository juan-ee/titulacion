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
    }
};

function getExpectedTime() {
    return Math.ceil(Math.random()*60+30);
}