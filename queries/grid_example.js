var utils = require('./utils'); // Functions used by multiple queries are in utils.

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
                    // We send only the tiles for which the number of businesses is superior to what wants the user.
                    if (grid.features[i].properties.business_ids.length >= parameters.minBusinessPerTile) {
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
                            popup: grid.features[i].properties.business_ids.length.toString(), // Show the number of businesses in the tile.
                            options: {}
                        });
                    }
                }
                // Sending back the polygons.
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
