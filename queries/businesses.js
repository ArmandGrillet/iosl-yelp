/* Returns the businesses in a specified category */

var utils = require('./utils'); // Functions used by multiple queries are in utils.

function getBusinessesWithCategoryInCity(city, category, callback) {
    utils.askDrill("select business_id, latitude, longitude from " + utils.datasetPath('business') + " where city='" + city + "' and true=repeated_contains(categories,'" + category + "')", function(answer) {
        callback(answer.rows);
    });
}

module.exports = {
    get: function(parameters, callback) {
        if (parameters.category === undefined) { // We only need to test the category as city is a mandatory attribute {
            callback({
                error: 'Parameter category is undefined'
            });
        } else {
            // Send a request to Drill and wait for the data
            getBusinessesWithCategoryInCity(parameters.city, parameters.category, function(businesses) {
                // Create the JSON answer for Leaflet
                var answer = {
                    markers: []
                };
                // For each business we push a new marker.
                for (var i = 0; i < businesses.length; i++) {
                    answer.markers.push({
                        latitude: businesses[i].latitude,
                        longitude: businesses[i].longitude,
                        options: {
                            alt: businesses[i].business_id, // Will allow the user to click on the marker in order to see more info.
                            onclick: true
                        }
                    });
                }
                // Send the information back to the front-end.
                callback(answer);
            });
        }
    },
    test: function() {
        console.log("Test not yet implemented");
    }
};
