var utils = require('./utils');

module.exports = {
    get: function(parameters, callback) {
        if (parameters.score === undefined) {
            callback({
                error: 'Parameter score is undefined'
            });
        } else {
            utils.getGrid(parameters.city, function(grid) {
                var answer = {
                    polygons: []
                };
                var i, score, inversedScore, color;
                var minScore = 1;
                var maxScore = 0;
                for (i = 0; i < grid.features.length; i++) {
                    score = grid.features[i].properties.scores[parameters.score];
                    if (score < minScore) {
                        minScore = score;
                    }
                    if (score > maxScore) {
                        maxScore = score;
                    }
                }
                for (i = 0; i < grid.features.length; i++) {
                    score = (grid.features[i].properties.scores[parameters.score] - minScore) / (maxScore - minScore);
                    if (Math.round(score * 256) >= 255) {
                        score = 0.995;
                    }
                    color = '#' + Math.round(score * 256).toString(16) + '0000';
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
                            fillOpacity: score
                        }
                    });
                }
                callback(answer);
            });
        }

    },
    test: function() {
        console.log('Test not yet implemented');
    }
};
