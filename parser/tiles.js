/*jslint node: true */
'use strict';

var async = require('async');
var fs = require('fs');
// var los = require('land-or-sea');
var parserUtils = require('./parserUtils.js');
var utils = require('../queries/utils');

var cities = { // Cities we show in the webapp with their coordinates.
    'Pittsburgh': {
        latitude: 40.440625,
        longitude: -79.995886
    },
    'Charlotte': {
        latitude: 35.227087,
        longitude: -80.843127
    },
    'Champaign': {
        latitude: 40.11642,
        longitude: -88.24338
    },
    'Phoenix': {
        latitude: 33.448377,
        longitude: -112.074037
    },
    'Las Vegas': {
        latitude: 36.169941,
        longitude: -115.139830
    },
    'Madison': {
        latitude: 43.073052,
        longitude: -89.401230
    },
    'Montreal': {
        latitude: 45.501689,
        longitude: -73.567256
    },
    'Waterloo': {
        latitude: 43.4668000,
        longitude: -80.5163900
    },
    'Karlsruhe': {
        latitude: 49.006890,
        longitude: 8.403653
    },
    'Edinburgh': {
        latitude: 55.953252,
        longitude: -3.188267
    },
};

function getAllBusinessesIn(city, callback) {
    utils.askDrill("select business_id, latitude, longitude from " + utils.datasetPath('business') + " where city='" + city + "'", function(answer) {
        callback(answer.rows);
    });
}

function metersToDegrees(distance, latitude, longitude) {
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
            city = utils.capitalizeFirstLetter(val);
            break;
        default:
            break;
    }
});

if (city === undefined) {
    console.log('Usage: node tiles CITY. E.g. \'node tiles Edinburgh\' will create a Edinburgh.geojson file');
}

getAllBusinessesIn(city, function(businesses) {
    var hundredMetersInCoordinates = metersToDegrees(100, cities[city].latitude, cities[city].longitude);
    var hundredMetersLatitude = 1 / hundredMetersInCoordinates.latitude;
    var hundredMetersLongitude = 1 / hundredMetersInCoordinates.longitude;

    for (i = 0; i < businesses.length; i++) {
        businesses[i].latitude = Math.round(businesses[i].latitude * hundredMetersLatitude);
        businesses[i].longitude = Math.round(businesses[i].longitude * hundredMetersLongitude);
    }

    var minLat = businesses[0].latitude,
        maxLat = businesses[0].latitude,
        minLon = businesses[0].longitude,
        maxLon = businesses[0].longitude;
    var i, j;

    for (i = 1; i < businesses.length; i++) {
        if (businesses[i].latitude < minLat) {
            minLat = businesses[i].latitude;
        } else if (businesses[i].latitude > maxLat) {
            maxLat = businesses[i].latitude;
        }

        if (businesses[i].longitude < minLon) {
            minLon = businesses[i].longitude;
        } else if (businesses[i].longitude > maxLon) {
            maxLon = businesses[i].longitude;
        }
    }

    // Settling the grid and adding content
    var grid = [];
    for (i = 0; i <= maxLat - minLat; i++) {
        grid[i] = [];
        for (j = 0; j <= maxLon - minLon; j++) {
            grid[i].push([]);
        }
    }

    for (i = 0; i < businesses.length; i++) {
        grid[businesses[i].latitude - minLat][businesses[i].longitude - minLon].push(businesses[i].business_id);
    }

    var json = {
        "type": "FeatureCollection",
        "features": []
    };

    for (i = 0; i < maxLat - minLat; i++) { // 0.001° = 111.32 m
        for (j = 0; j < maxLon - minLon; j++) {
            json.features.push({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [(i + minLat) / hundredMetersLatitude, (j + minLon) / hundredMetersLongitude],
                        [(i + minLat) / hundredMetersLatitude, ((j + minLon) + 1) / hundredMetersLongitude],
                        [((i + minLat) + 1) / hundredMetersLatitude, ((j + minLon) + 1) / hundredMetersLongitude],
                        [((i + minLat) + 1) / hundredMetersLatitude, (j + minLon) / hundredMetersLongitude]
                    ]
                },
                "properties": {
                    "business_ids": grid[i][j]
                }
            });
        }
    }

    fs.writeFileSync('../static/grid/' + city + '.geojson', JSON.stringify(json));

    // var lightweightJSON = {
    //     "type": "FeatureCollection",
    //     "features": []
    // };

    // json.features.forEach(function(tile) {
    //     los.checkForCoordinates(tileCenter.latitude, tileCenter.longitude, function(field, error) {
    //         if (error) {
    //             console.log(error);
    //         } else if (field === 'land') {
    //             console.log('land');
    //             lightweightJSON.features.push(tile);
    //         } else {
    //             console.log('sea');
    //         }
    //         callback();
    //     });
    // });

    // var tileCenter;
    // var x = 0;
    // var loopArray = function(json) {
    //     tileCenter = utils.getCenterTile(json.features[x].geometry.coordinates);
    //     los.checkForCoordinates(tileCenter.latitude, tileCenter.longitude, function(field, error) {
    //         // set x to next item
    //         x++;
    //
    //         console.log(error);
    //         if (!error) {
    //             if (field === 'land') {
    //                 lightweightJSON.features.push(json.features[x]);
    //             } else {
    //                 console.log('sea');
    //             }
    //         }
    //
    //         // any more items in array? continue loop
    //         if (x < json.features.length) {
    //             loopArray(json);
    //         } else {
    //             console.log('done');
    //         }
    //     });
    // };
    //
    // loopArray(json);

    // for (i = 0; i < json.features.length; i++) {
    //     (function(cntr) {
    //         // here the value of i was passed into as the argument cntr
    //         // and will be captured in this function closure so each
    //         // iteration of the loop can have it's own value
    //         tileCenter = utils.getCenterTile(json.features[cntr].geometry.coordinates);
    //         los.checkForCoordinates(tileCenter.latitude, tileCenter.longitude, function(field, error) {
    //             if (error) {
    //                 console.log(error);
    //             } else if (field === 'land') {
    //                 console.log('land');
    //                 lightweightJSON.features.push(json.features[cntr]);
    //             } else {
    //                 console.log('sea');
    //             }
    //         });
    //     })(i);
    // }

    // async.series(json.features, function(tile, callback) {
    //     var tileCenter = utils.getCenterTile(tile.geometry.coordinates);
    //     los.checkForCoordinates(tileCenter.latitude, tileCenter.longitude, function(field, error) {
    //         if (error) {
    //             console.log(error);
    //         } else if (field === 'land') {
    //             console.log('land');
    //             lightweightJSON.features.push(tile);
    //         } else {
    //             console.log('sea');
    //         }
    //         callback();
    //     });
    // }, function(err) {
    //     console.log("Done");
    //     if (err === null) {
    //         console.log(lightweightJSON.features.length);
    //
    //     } else {
    //         console.log(err);
    //     }
    // });
});
