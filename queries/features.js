var utils = require('./utils');
var edinburgh = require("../static/features/edinburgh.json");
// We need to require all the cities.

module.exports = {
    get: function(parameters, callback) {
        var features = {
            markers: []
        };
        // Parameters are given by the map, check the Wiki for more info: https://gitlab.tubit.tu-berlin.de/fvictor257/iosl-business-ws1516/wikis/interacting-with-the-back-end
        var source;
        switch (parameters.city.toLowerCase()) {
            case 'edinburgh':
                source = edinburgh;
        }

        var type;
        for (var i = 0; i < source.types.length; i++) {
            type = source.types[i];
            for (var j = 0; j < source[type].length; j++) {
                features.markers.push({
                    latitude: source[type][j].lat,
                    longitude: source[type][j].lon,
                    options: {
                        icon: type
                    }
                });
            }
        }
        callback(features);
    },
    test: function() {
        empty(function(answer) {
            console.log("Result of the algorithm: ");
            console.log(answer);
        });
    }
};
