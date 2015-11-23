var utils = require('./utils');

function getCheckinsByBusinessId(city, callback) {
    utils.askDrill("SELECT table_checkin.business_id,table_checkin.checkin_info from " + utils.datasetPath('checkin') + " AS table_checkin INNER JOIN " + utils.datasetPath('business') + " AS table_business ON table_checkin.business_id = table_business.business_id WHERE table_business.city = '" + city + "'", function(answer) {
        callback(answer.rows);
    });
}

var sum = []; // number of checkins for one business
var total_sum = 0; // total number of checkins in every business of the city

module.exports = {
    get: function(parameters, callback) {
        getCheckinsByBusinessId(parameters.city, function(businesses) {

            for (var k = 0; k < businesses.length; k++) {
                sum[businesses[k].business_id] = 0;
            }

            for (var i = 0; i < businesses.length; i++) {
                checkin = JSON.parse(businesses[i].checkin_info);
                for (var key in checkin) {
                    sum[businesses[i].business_id] += checkin[key];
                }
                total_sum += sum[businesses[i].business_id];
            }

            utils.getGrid(parameters.city, function(grid) {
                var gridPolygons = [];
                var ratioCheckins = Array(grid.features.length).fill(4); // number of checkins per grid[][] divided by total number of checkins
                var checkinMax = 0; //max number of checkins per grid[][]
                var i;

                for (i = 0; i < grid.features.length; i++) {
                    if (grid.features[i].properties.business_ids.length >= 2) { // There is at least 2 businesses in the area.
                        for (j = 0; j < grid.features[i].properties.business_ids.length; j++) {
                            if (sum[grid.features[i].properties.business_ids[j]] !== undefined) {
                                ratioCheckins[i] += sum[grid.features[i].properties.business_ids[j]];
                            }
                        }
                        if (ratioCheckins[i] > checkinMax)
                            checkinMax = ratioCheckins[i];
                    }
                }

                for (i = 0; i < grid.features.length; i++) {
                    if (grid.features[i].properties.business_ids.length >= 2) { // There is at least 2 businesses in the area.
                        gridPolygons.push({
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
                            popup: grid.features[i].properties.business_ids.length.toString(),
                            options: {
                                stroke: false,
                                fill: true,
                                fillColor: "#FF0000",
                                fillOpacity: (ratioCheckins[i] / checkinMax)
                            }
                        });
                    }
                }
                var answer = {
                    polygons: gridPolygons
                };
                callback(answer);
            });
        });
    },
    test: function() {
        console.log('Test not yet implemented');
    }
};
