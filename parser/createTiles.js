/* Create the grids used by the queries */

/*jslint node: true */
'use strict';

var fs = require('fs'); // We want to write the grid thus we need fs.
var parserUtils = require('./parserUtils.js'); // Regular utils for parser.
var utils = require('../queries/utils'); // Regular utils for queries.

// Positions of the cities handled by Yelp.
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

// Transform a distance in meters into a new latitude/longitude.
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

// Name of the city where we have to proceed
var city;

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

// We need a city.
if (city === undefined) {
    console.log('Usage: node tiles CITY. E.g. \'node tiles Edinburgh\' will create a Edinburgh.geojson file');
}

// Get the coordinates representing 250 meters in the city.
var metersInCoordinates = metersToDegrees(250, cities[city].latitude);

// Setting the limits of the grid.
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

// Creation of the grid.
var geojson = {
    "type": "FeatureCollection",
    "features": []
};

// Variables for the loops.
var i, j;

// Add the tiles on the grid based on the limits.
for (i = minLat; i < maxLat; i += metersInCoordinates.latitude) {
    for (j = minLon; j < maxLon; j += metersInCoordinates.longitude) {
        geojson.features.push({
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
// Adding the features we need to the grid
fs.readFile('../static/features/' + city + '.json', 'utf8', function(err, data) { // Getting the features from the linked JSON file.
    if (err) { // Problem to read the file.
        return console.log(err);
    }
    var source = JSON.parse(data); // Parsing the features to manipulate them.
    var centerTile;
    var usefulFeatures = ['atm', 'stadium', 'convenience', 'restaurant', 'bank', 'toilets', 'kindergarten', 'guest', 'theatre', 'college', 'gallery', 'museum', 'courthouse'];
    for (var i = 0; i < geojson.features.length; i++) { // Iterating through all the tiles.
        centerTile = utils.getCenterTile(geojson.features[i].geometry.coordinates); // We use the center of the tile to determine the distance.
        for (var j = 0; j < source.types.length; j++) { // Iterating through all the features.
            if (usefulFeatures.indexOf(source.types[j]) != -1) { // This is a useful feature
                geojson.features[i].properties[source.types[j]] = Math.round(parserUtils.getDistanceToNearestElement(centerTile, source[source.types[j]]) * 1000); // Setting the distance to the nearest feature of this kind.
                if (source.types[j] == 'atm') { // An ATM, we need to know how many of them are in a redius of 100 meters.
                    geojson.features[i].properties['atm.1'] = parserUtils.getNumberOfFeaturesforRadius(centerTile, 100, source[source.types[j]]); // Settign the number of ATMs in a 100m radius.
                }
            }
        }
    }
    fs.writeFileSync('../static/grid/' + city + '.geojson', JSON.stringify(geojson)); // Writing the file.
});
