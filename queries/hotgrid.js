var utils = require('./utils');
var svm = require('node-svm');

module.exports = {
    get: function(parameters, callback) {
        utils.getGrid(parameters.city, function(grid) {
            var answer = {
                markers: []
            };
            for (var i = 0; i < grid.features.length; i++) {
                answer.markers.push({
                    latitude: getCenter(utils.grid.features[i].geometry.coordinates).latitude,
                    longitude: getCenter(utils.grid.features[i].geometry.coordinates).longitude
                });
            }

            callback(answer);
        });
    },
    test: function() {
        console.log('Test not yet implemented');
    }
};
