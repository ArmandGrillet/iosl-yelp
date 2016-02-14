/* Displaying the hotgrid */

var utils = require('./utils'); // Functions used by multiple queries are in utils.

module.exports = {
    get: function(parameters, callback) {
        if (parameters.score === undefined) {
            callback({
                error: 'Parameter score is undefined'
            });
        } else {
            // We get the grid using an utils function
            utils.getGrid(parameters.city, function(grid) {
                // The grid will be composed of polygons, each of them representing a tile.
                var answer = {
                    polygons: []
                };
                var i, score, inversedScore, color;

                // We need to normalize the values, first we find the minimum and maximum score.
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
                        score = 0.995; // If there is a score of 1 the .toString(16) won't work thus we're putting it a little below.
                    }
                    color = '#' + Math.round(score * 256).toString(16) + '0000'; // The tile is made of 256 shades of red, green and blue are set at 0.
                    answer.polygons.push({
                        points: [ // The four points forming the tile.
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
                        popup: Math.round(score * 100).toString() + " / 100", // We display the score of the tile as a title.
                        options: {
                            fillColor: color, // Color of the tile
                            stroke: false, // No stroke, we want something smooth
                            fillOpacity: score - 0.3 // The transparency of the tile depends on its success
                        }
                    });
                }
                callback(answer); // Sending the grid back.
            });
        }

    },
    test: function() {
        console.log('Test not yet implemented');
    }
};
