/*jslint node: true */
'use strict';

var fs = require('fs'); // We want to write the grid thus we need fs.
var parserUtils = require('./parserUtils.js'); // Regular utils for parser.
var utils = require('../queries/utils'); // Regular utils.

// Cities we show in the webapp with their coordinates.
var cities = {
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

var i, j, k;

for (i = minLat; i < maxLat; i += metersInCoordinates.latitude) {
    for (j = minLon; j < maxLon; j += metersInCoordinates.longitude) {
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
            "properties": {}
        });
    }
}
// Adding the features
fs.readFile('../static/features/' + city + '.json', 'utf8', function(err, data) { // Getting the features
    if (err) {
        return console.log(err);
    }
    var source = JSON.parse(data); // Parsing the fatures to manipulate them.
    parserUtils.isDrillRunning(function(running) {
        if (running === false) {
            console.log('Start Apache Drill before running this algorithm');
        } else {
            var centerTile;
            for (var i = 0; i < json.features.length; i++) {
                centerTile = utils.getCenterTile(json.features[i].geometry.coordinates);
                for (var j = 0; j < source.types.length; j++) {
                    if (['atm', 'stadium', 'convenience', 'restaurant', 'bank', 'toilets', 'kindergarten', 'guest', 'theatre', 'college', 'gallery', 'museum', 'courthouse'].indexOf(source.types[j]) != -1) {
                        json.features[i].properties[source.types[j]] = Math.round(parserUtils.getDistanceToNearestElement(centerTile, source[source.types[j]]) * 1000);
                        if (source.types[j] == 'atm') {
                            json.features[i].properties['atm.1'] = parserUtils.getNumberOfFeaturesforRadius(centerTile, 100, source[source.types[j]]);
                        }
                    }
                }
            }
        }
        fs.writeFileSync('../static/grid/' + city + '.geojson', JSON.stringify(json));
    });
});
