/* Useful functions for our queries. */

/*jslint node: true */
'use strict';

var request = require('request'); // We need the request framework to post requests to Drill.
var path = require('path'); // We need path to normalize some paths.
var fs = require('fs'); // We need fs to read the grid files.

module.exports = {
    /* Send a request to Apache Drill */
    askDrill: function(query, callback) {
        request.post(
            'http://localhost:8047/query.json', // Adress of Apache Drill
            {
                json: {
                    'queryType': 'SQL',
                    'query': query
                }
            },
            function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    callback(body);
                }
            }
        );
    },
    /* Capitalize the first letter of the string */
    capitalizeFirstLetter: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    },
    /* Return the dataset file path */
    datasetPath: function(dataset) {
        return 'dfs.`' + path.normalize(__dirname + '/../../yelp_dataset_challenge_academic_dataset/') + 'yelp_academic_dataset_' + dataset + '.json`';
    },
    /* Return the distance in kilometers between two latitude/longitude */
    distance: function(lat1, lon1, lat2, lon2) {
        var radlat1 = Math.PI * lat1 / 180;
        var radlat2 = Math.PI * lat2 / 180;
        var radlon1 = Math.PI * lon1 / 180;
        var radlon2 = Math.PI * lon2 / 180;
        var theta = lon1 - lon2;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        return dist;
    },
    /* Return the feature path for a city */
    featuresPath: function(city) {
        return path.normalize(__dirname + '/../static/features/' + city + '.json');
    },
    /* Return the center of a tile using its coordinates that use the standard .geojson format */
    getCenterTile: function(coordinates) {
        var center = {
            latitude: coordinates[0][0],
            longitude: coordinates[0][1]
        };

        for (var i = 1; i < coordinates.length; i++) {
            center.latitude = (center.latitude * i + coordinates[i][0]) / (i + 1);
            center.longitude = (center.longitude * i + coordinates[i][1]) / (i + 1);
        }

        return center;
    },
    /* Return the grid of a city */
    getGrid: function(city, callback) {
        var grid = JSON.parse(fs.readFileSync('../static/grid/' + city + '.geojson', 'utf8'));
        return callback(grid);
    },
};
