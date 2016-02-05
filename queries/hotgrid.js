var utils = require('./utils');

module.exports = {
    get: function(parameters, callback) {
        utils.getGrid(parameters.city, function(grid) {
            var answer = {
                polygons: []
            };
            var score, inversedScore, color;
            for (var i = 0; i < grid.features.length; i++) {
                score = Math.round(grid.features[i].properties.scores.general_score * 256);
                inversedScore = Math.round((1 - grid.features[i].properties.scores.general_score) * 256);
                color = '#' + score.toString(16) + '00' + '00';
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
                    popup: color,
                    options: {
                        fillColor: color,
                        stroke: false,
                        fillOpacity: 1
                    }
                });
            }
            callback(answer);
        });
    },
    test: function() {
        console.log('Test not yet implemented');
    }
};
