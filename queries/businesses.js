var utils = require('./utils');

function getBusinessesWithCategoryInCity(city, category, callback) {
    utils.askDrill("select business_id, latitude, longitude from " + utils.datasetPath('business') + " where city='" + city + "' and categories[0] = '" + category + "'", function(answer) {
        console.log(answer);
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
            getBusinessesWithCategoryInCity(parameters.city, parameters.category, function(businesses) {
                var answer = {
                    markers: []
                };
                for (var i = 0; i < businesses.length; i++) {
                    answer.markers.push({
                        latitude: businesses[i].latitude,
                        longitude: businesses[i].longitude,
                        options: {
                            alt: businesses[i].business_id,
                            onclick: true
                        }
                    });
                }
                callback(answer);
            });
        }
    },
    test: function() {
        console.log("Test not yet implemented");
    }
};
