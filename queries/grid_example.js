var utils = require('./utils');

function getBusinessesInCity(city, callback) {
    utils.askDrill("select name, latitude, longitude from " + utils.datasetPath('business') + " where city='" + city + "'", function(answer) {
        callback(answer.rows);
    });
}

module.exports = {
    get: function(parameters, callback) {
        if (parameters.minBusinessPerTile === undefined) {
            callback({
                error: 'Parameter minBusinessPerTile is undefined'
            });
        } else {
            utils.getGrid(parameters.city, function(grid) {
                var gridPolygons = [];
                var i;
                for (i = 0; i < grid.features.length; i++) {
                    if (grid.features[i].properties.business_ids.length >= parameters.minBusinessPerTile) { // There is at least 2 businesses in the area.
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
                            options: {}
                        });
                    }
                }
                var answer = {
                    polygons: gridPolygons
                };
                callback(answer);
            });
        }
    },
    test: function() {
        console.log('Test not yet implemented');
    }
};
