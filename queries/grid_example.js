var utils = require('./utils');

function getBusinessesInCity(city, callback) {
    utils.askDrill("select name, latitude, longitude from " + utils.datasetPath('business') + " where city='" + city + "'", function(answer) {
        callback(answer.rows);
    });
}

module.exports = {
    get: function(parameters, callback) {
        utils.getGrid(parameters.city, function(grid) {
            var gridPolygons = [];
            for (i = 0; i < grid.length; i++) { // 0.001° = 111.32 m
                for (j = 0; j < grid[i].length; j++) {
                    if (grid[i][j].business_ids.length >= 2) { // There is at least 2 businesses in the area.
                        gridPolygons.push({
                            points: grid[i][j].points,
                            popup: grid[i][j].business_ids.length.toString(),
                            options: {}
                        });
                    }
                }
            }
            var answer = {
                polygons: gridPolygons
            };
            callback(answer);
        });
    },
    test: function() {
        console.log('Test not yet implemented');
    }
};
