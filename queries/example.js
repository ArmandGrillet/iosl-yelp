var utils = require('./utils');

function getBusinessesWithNameInCity(city, business, callback) {
    utils.askDrill("select name, latitude, longitude from " + utils.datasetPath('business') + " where city='" + city + "' and name = '" + business + "'", function(answer) {
        console.log(answer);
        callback(answer.rows);
    });
}

module.exports = {
    get: function(parameters, callback) {
        if (parameters.business === undefined) { // We only need to test name as city is a mandatory attribute {
            callback({
                error: 'Parameter business is undefined'
            });
        } else {
            getBusinessesWithNameInCity(parameters.city, parameters.business, function(businesses) {
                var answer = {
                    markers: []
                };
                for (var i = 0; i < businesses.length; i++) {
                    answer.markers.push({
                        latitude: businesses[i].latitude,
                        longitude: businesses[i].longitude,
                        popup: businesses[i].name
                    });
                }
                callback(answer);
            });
        }
    },
    test: function() {
        getBusinessesWithNameInCity('Phoenix', 'Starbucks', function(businesses) {
            console.log("Localization of all the Starbucks in Phoenix:");
            for (var i = 0; i < businesses.length; i++) {
                console.log('Latitude: ' + businesses[i].latitude + " - longitude: " + businesses[i].longitude);
            }
        });
    }
};
