/*jslint node: true */
'use strict';

var request = require('request');
var path = require('path');
var fs = require('fs');

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

function writeGrid(city, grid) {
    var json = {
        "type": "FeatureCollection",
        "features": []
    };
    var i, j;
    for (i = 0; i < grid.length; i++) {
        for (j = 0; j < grid[i].length; j++) {
            if (grid[i][j].business_ids.length > 0) {
                json.features.push({
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [grid[i][j].points[0].latitude, grid[i][j].points[0].longitude],
                            [grid[i][j].points[1].latitude, grid[i][j].points[1].longitude],
                            [grid[i][j].points[2].latitude, grid[i][j].points[2].longitude],
                            [grid[i][j].points[3].latitude, grid[i][j].points[3].longitude]
                        ]
                    },
                    "properties": {
                        "business_ids": grid[i][j].business_ids
                    }
                });
            }
        }
    }
    fs.writeFileSync('../queries/geojson/' + city + '.geojson', JSON.stringify(json));
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
    capitalizeFirstLetter: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    },
    datasetPath: function(dataset) {
        return 'dfs.`' + path.normalize(__dirname + '/../../yelp_dataset_challenge_academic_dataset/') + 'yelp_academic_dataset_' + dataset + '.json`';
    },
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
    getGrid: function(city, callback) {
        var grid = JSON.parse(fs.readFileSync('../queries/geojson/' + city + '.geojson', 'utf8'));
        return callback(grid);
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
    },
    path: function(dataset) {
        return path.normalize(__dirname + '/../../yelp_dataset_challenge_academic_dataset/') + 'yelp_academic_dataset_' + dataset + '.json';
    },
};
