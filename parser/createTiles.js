/*jslint node: true */
'use strict';

var async = require('async');
var fs = require('fs');
var parserUtils = require('./parserUtils.js');
var utils = require('../queries/utils');

function getAllBusinessesIn(city, callback) {
    utils.askDrill("select business_id, latitude, longitude from " + utils.datasetPath('business') + " where city='" + city + "'", function(answer) {
        callback(answer.rows);
    });
}

var cities = { // Cities we show in the webapp with their coordinates.
    // Charlotte NE = 35.2455, -80.8065
    // Charlotte W = OSEF, -80.8665
    // Charlotte S = 35.195499999999996, OSEF
    'Charlotte': {
        latitude: 35.227087,
        longitude: -80.843127,
        north: 35.246,
        east: -80.806,
        south: 35.195,
        west: -80.867
    },
    'Pittsburgh': {
        latitude: 40.440625,
        longitude: -79.995886,
        north: 40.498,
        east: -79.943,
        south: 40.368,
        west: -80.074
    },
    'Champaign': {
        latitude: 40.11642,
        longitude: -88.24338,
        north: 40.139,
        east: -88.227,
        south: 40.091,
        west: -88.25
    },
    'Phoenix': {
        latitude: 33.448377,
        longitude: -112.074037,
        north: 33.512,
        east: -111.984,
        south: 33.429,
        west: -112.138
    },
    'Las Vegas': {
        latitude: 36.169941,
        longitude: -115.139830,
        north: 36.188,
        east: -115.115,
        south: 36.062,
        west: -115.252
    },
    'Madison': {
        latitude: 43.073052,
        longitude: -89.401230,
        north: 43.105,
        east: -89.341,
        south: 43.057,
        west: -89.429
    },
    'Montreal': {
        latitude: 45.501689,
        longitude: -73.567256,
        north: 45.539,
        east: -73.541,
        south: 45.46,
        west: -73.654
    },
    'Waterloo': {
        latitude: 43.4668000,
        longitude: -80.5163900,
        north: 43.49,
        east: -80.493,
        south: 43.455,
        west: -80.547
    },
    'Karlsruhe': {
        latitude: 49.006890,
        longitude: 8.403653,
        north: 49.0176,
        east: 8.445,
        south: 48.993,
        west: 8.354
    },
    'Edinburgh': {
        latitude: 55.953252,
        longitude: -3.188267,
        north: 55.979,
        east: -3.168,
        south: 55.924,
        west: -3.236
    },
};

function metersToDegrees(distance, latitude) {
    //Earth’s radius, sphere
    var radius = 6378137;

    //Coordinate offsets in radians
    var newLatitude = distance / radius;
    var newLongitude = distance / (radius * Math.cos(Math.PI * latitude / 180));

    //OffsetPosition, decimal degrees
    return {
        'latitude': newLatitude * 180 / Math.PI,
        'longitude': newLongitude * 180 / Math.PI
    };
}

var city; // Name of the city where we have to proceed

// Processing the parameters.
process.argv.forEach(function(val, index, array) {
    switch (index) {
        case 2:
            if (val === 'LV') {
                city = 'Las Vegas';
            } else {
                city = utils.capitalizeFirstLetter(val);
            }
            break;
        default:
            break;
    }
});

if (city === undefined) {
    console.log('Usage: node tiles CITY. E.g. \'node tiles Edinburgh\' will create a Edinburgh.geojson file');
}

getAllBusinessesIn(city, function(businesses) {
    var metersInCoordinates = metersToDegrees(250, cities[city].latitude);

    var minLat, maxLat, minLon, maxLon;
    if (cities[city].south < cities[city].north) {
        minLat = cities[city].south;
        maxLat = cities[city].north;
    } else {
        minLat = cities[city].north;
        maxLat = cities[city].south;
    }

    if (cities[city].east < cities[city].west) {
        minLon = cities[city].east;
        maxLon = cities[city].west;
    } else {
        minLon = cities[city].west;
        maxLon = cities[city].east;
    }


    var json = {
        "type": "FeatureCollection",
        "features": []
    };

    var businessesInTile = [];
    var i, j, k;

    for (i = minLat; i < maxLat; i += metersInCoordinates.latitude) {
        for (j = minLon; j < maxLon; j += metersInCoordinates.longitude) {
            businessesInTile = [];
            for (k = 0; k < businesses.length; k++) {
                if (businesses[k].latitude >= i && businesses[k].latitude <= i + metersInCoordinates.latitude && businesses[k].longitude >= j && businesses[k].longitude <= j + metersInCoordinates.longitude) {
                    businessesInTile.push(businesses[k].business_id);
                }
            }
            json.features.push({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [i, j],
                        [i, j + metersInCoordinates.longitude],
                        [i + metersInCoordinates.latitude, j + metersInCoordinates.longitude],
                        [i + metersInCoordinates.latitude, j]
                    ]
                },
                "properties": {
                    "business_ids": businessesInTile
                }
            });
        }
    }
    fs.writeFileSync('../static/grid/' + city + '.geojson', JSON.stringify(json));
});
