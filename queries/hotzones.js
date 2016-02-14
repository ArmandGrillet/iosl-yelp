/* Display the hot zones of a city using the number of checkins in a tile */

var utils = require('./utils'); // Functions used by multiple queries are in utils.

function getBusinessesWithCheckins(city, callback) {
    utils.askDrill("SELECT table_checkin.business_id, table_checkin.checkin_info from " + utils.datasetPath('checkin') + " AS table_checkin INNER JOIN " + utils.datasetPath('business') + " AS table_business ON table_checkin.business_id = table_business.business_id WHERE table_business.city = '" + city + "'", function(answer) {
        callback(answer.rows);
    });
}

module.exports = {
    get: function(parameters, callback) {
        getBusinessesWithCheckins(parameters.city, function(businesses) {
            var i, j;
            var checkin;
            var checkinsPerBusiness = {}; // Number of checkins for one business
            for (i = 0; i < businesses.length; i++) {
                checkinsPerBusiness[businesses[i].business_id] = 0;
                checkin = JSON.parse(businesses[i].checkin_info);
                // The checkin variable is a JSON object containing the number of checkins at a specific time, we only need the number of checkins per day.
                for (var key in checkin) {
                    checkinsPerBusiness[businesses[i].business_id] += checkin[key];
                }
            }

            utils.getGrid(parameters.city, function(grid) {
                // We'll send to Leaflet only polygons representing tiles.
                var answer = {
                    polygons: []
                };

                var maxCheckins = 0; // Maximum number of checkins in the grid.
                for (i = 0; i < grid.features.length; i++) {
                    // We had a new value to the grid JSON called checkins, representing the number of checkins in a tile.
                    grid.features[i].properties.checkins = 0;
                    for (j = 0; j < grid.features[i].properties.business_ids.length; j++) {
                        if (checkinsPerBusiness[grid.features[i].properties.business_ids[j]] !== undefined) {
                            grid.features[i].properties.checkins += checkinsPerBusiness[grid.features[i].properties.business_ids[j]];
                        }
                    }
                    if (maxCheckins < grid.features[i].properties.checkins) {
                        maxCheckins = grid.features[i].properties.checkins;
                    }
                }

                for (i = 0; i < grid.features.length; i++) { // For each tile
                    if (grid.features[i].properties.business_ids.length >= 2) { // There is at least 2 businesses in the tile.
                        answer.polygons.push({
                            points: [
                                {
                                    latitude: grid.features[i].geometry.coordinates[0][0],
                                    longitude: grid.features[i].geometry.coordinates[0][1]
                                },
                                {
                                    latitude: grid.features[i].geometry.coordinates[1][0],
                                    longitude: grid.features[i].geometry.coordinates[1][1]
                                },
                                {
                                    latitude: grid.features[i].geometry.coordinates[2][0],
                                    longitude: grid.features[i].geometry.coordinates[2][1]
                                },
                                {
                                    latitude: grid.features[i].geometry.coordinates[3][0],
                                    longitude: grid.features[i].geometry.coordinates[3][1]
                                }
                            ],
                            popup: grid.features[i].properties.checkins.toString(), // The popup is the number of checkins.
                            options: {
                                stroke: false,
                                fill: true,
                                fillColor: "#FF0000",
                                fillOpacity: (grid.features[i].properties.checkins / maxCheckins) // The opacity depends on the number of checkins.
                            }
                        });
                    }
                }
                // Send back the tiles.
                callback(answer);
            });
        });
    },
    test: function() {
        console.log('Test not yet implemented');
    }
};
