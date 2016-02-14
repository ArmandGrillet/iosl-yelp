/* Return businesses having the name specified */

var utils = require('./utils'); // Functions used by multiple queries are in utils.

function getBusinessesWithNameInCity(city, name, callback) {
    utils.askDrill("select name, latitude, longitude from " + utils.datasetPath('business') + " where city='" + city + "' and name = '" + name + "'", function(answer) {
        callback(answer.rows);
    });
}

module.exports = {
    get: function(parameters, callback) {
        if (parameters.name === undefined) { // We only need to test name as city is a mandatory attribute
            callback({
                error: 'Parameter name is undefined'
            });
        } else {
            getBusinessesWithNameInCity(parameters.city, parameters.name, function(businesses) {
                if (businesses[0].name === undefined) { // There is no businesses with that name.
                    callback({
                        error: 'No businesses with that name'
                    });
                } else { // There is at least one business, we return it as a marker.
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
                }
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
