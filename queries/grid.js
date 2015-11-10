var utils = require('./utils');

function getBusinessesInCity(city, callback) {
    utils.askDrill("select name, latitude, longitude from " + utils.datasetPath('business') + " where city='" + city + "'", function(answer) {
        callback(answer.rows);
    });
}

module.exports = {
    get: function(parameters, callback) {
        getBusinessesInCity(parameters.city, function(businesses) {
            // We're roundign the numbers to 0.001° = 111.32 m and removing the period.
            for (i = 0; i < businesses.length; i++) {
                businesses[i].latitude = Math.round(businesses[i].latitude * 1000);
                businesses[i].longitude = Math.round(businesses[i].longitude * 1000);
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
                    grid[i].push(0);
                }
            }
            for (i = 0; i < businesses.length; i++) {
                console.log("grid[" + (businesses[i].latitude - minLat) + "][" + (businesses[i].longitude - minLon) + "] = " + grid[businesses[i].latitude - minLat][businesses[i].longitude - minLon]);
                grid[businesses[i].latitude-minLat][businesses[i].longitude-minLon]++;
            }

            var gridPolygons = [];
            for (i = 0; i < maxLat - minLat; i++) { // 0.001° = 111.32 m
                for (j = 0; j < maxLon - minLon; j++) {
                    if (grid[i][j] > 2) { // There is at least 2 businesses in the area.
                        gridPolygons.push({
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
                            popup: grid[i][j].toString(),
                            options: {}
                        });
                    }
                }
            }
            var answer = {
                polygons: gridPolygons
            };
            console.log(answer);
            callback(answer);
        });
    },
    test: function() {
        console.log('Test not yet implemented');
    }
};
