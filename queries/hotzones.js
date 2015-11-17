var utils = require('./utils');

function getCheckinsByBusinessId(city, callback) {
    utils.askDrill("SELECT table_checkin.business_id,table_checkin.checkin_info from " + utils.datasetPath('checkin') + " AS table_checkin INNER JOIN " + utils.datasetPath('business') + " AS table_business ON table_checkin.business_id = table_business.business_id WHERE table_business.city = '" + city + "'", function(answer) {
        console.log(answer);
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
                var ratioCheckins = []; // number of checkins per grid[][] divided by total number of checkins
                var checkinMax = 0; //max number of checkins per grid[][]

                // fill ratioCheckins with 0 for the += operation
                for (i = 0; i < grid.length; i++) {
                    ratioCheckins[i] = [];
                    for (j = 0; j < grid[i].length; j++) {
                        ratioCheckins[i][j] = 0;
                        for (var p = 0; p < grid[i][j].business_ids.length; p++) {
                        }
                    }
                }

                /*                griddd = [];
                                for (i = 0; i < grid.length; i++) { // 0.001° = 111.32 m
                                    for (j = 0; j < grid[i].length; j++) {
                                        for (var k = 0; k < grid[i][j].business_ids.length; k++) {
                                            griddd[grid[i][j].business_ids[k]] = 0.2; // There is at least 2 businesses in the area.
                                        }
                                    }
                                }
                                console.log(Object.keys(sum).length);
                                console.log(Object.keys(griddd).length);
                                */

                // browsing the grid & adding values
                for (i = 0; i < grid.length; i++) { // 0.001° = 111.32 m
                    for (j = 0; j < grid[i].length; j++) {
                        if (grid[i][j].business_ids.length >= 2) { // There is at least 2 businesses in the area.
                            for (k = 0; k < grid[i][j].business_ids.length; k++) {
                                if (typeof (sum[grid[i][j].business_ids[k]]) != 'undefined') {
                                    ratioCheckins[i][j] += sum[grid[i][j].business_ids[k]];
                                }
                            }
                            if (ratioCheckins[i][j] > checkinMax)
                                checkinMax = ratioCheckins[i][j];
                        }
                    }
                }
                // browsing the grid and adding the opacity ratio
                for (i = 0; i < grid.length; i++) { // 0.001° = 111.32 m
                    for (j = 0; j < grid[i].length; j++) {
                        if (grid[i][j].business_ids.length >= 2) { // There is at least 2 businesses in the area.

                            gridPolygons.push({
                                points: grid[i][j].points,
                                popup: grid[i][j].business_ids.length.toString(),
                                options: {
                                    stroke: false,
                                    fill: true,
                                    fillColor: "#FF0000",
                                    fillOpacity: (ratioCheckins[i][j] / checkinMax)
                                }
                            });
                        }
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
