/*jslint node: true */
'use strict';

var request = require('request');
var path = require('path');

function gridForBusinesses(businesses) {
    var i, j;
    // We're rounding the numbers to 0.001° = 111.32 m and removing the period.
    for (i = 0; i < businesses.length; i++) {
        businesses[i].latitude = Math.round(businesses[i].latitude * 1000);
        businesses[i].longitude = Math.round(businesses[i].longitude * 1000);
    }
    var minLat = businesses[0].latitude,
        maxLat = businesses[0].latitude,
        minLon = businesses[0].longitude,
        maxLon = businesses[0].longitude;

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
            grid[i][j] = {
                points: [{
                    latitude: (i + minLat) / 1000,
                    longitude: (j + minLon) / 1000
                }, {
                    latitude: (i + minLat) / 1000,
                    longitude: ((j + minLon) + 1) / 1000
                }, {
                    latitude: ((i + minLat) + 1) / 1000,
                    longitude: ((j + minLon) + 1) / 1000
                }, {
                    latitude: ((i + minLat) + 1) / 1000,
                    longitude: (j + minLon) / 1000
                }],
                business_ids: []
            };
        }
    }
    for (i = 0; i < businesses.length; i++) {
        grid[businesses[i].latitude - minLat][businesses[i].longitude - minLon].business_ids.push(businesses[i].business_id);
    }

    for (i = 0; i < grid.length; i++) {
        for (j = 0; j < grid[i].length; j++) {
            if (grid[i][j].business_ids.length === 0) { // No businesses here
                grid[i].splice(j, 1);
            }
        }
    }

    return grid;
}

module.exports = {
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
    datasetPath: function(dataset) {
        return 'dfs.`' + path.normalize(__dirname + '/../../yelp_dataset_challenge_academic_dataset/') + 'yelp_academic_dataset_' + dataset + '.json`';
    },
    getGrid: function(city, callback) {
        this.askDrill("select business_id, latitude, longitude from " + this.datasetPath('business') + " where city='" + city + "'", function(answer) {
            return callback(gridForBusinesses(answer.rows));
        });
    },
    getGridForCategory: function(city, category, callback) {
        this.askDrill("select business_id, latitude, longitude from " + this.datasetPath('business') + " where city='" + city + "'", function(answer) {
            var businesses = answer.rows;
            for (var i = 0; i < businesses.length; i++) {
                if (businesses[i].categories.indexOf(category) == -1) {
                    businesses.splice(i, 1);
                }
            }
            return callback(gridForBusinesses(businesses));
        });
    }
};
