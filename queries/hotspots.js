/* Show the hotspots in a city for a specified category */

var utils = require('./utils'); // Functions used by multiple queries are in utils.

// Return one point from multiple points.
function centerPoint(points) {
    var meanLatitude = 0;
    var meanLongitude = 0;

    for (var i = 0; i < points.length; i++) {
        meanLatitude = parseFloat(meanLatitude) + parseFloat(points[i].latitude);
        meanLongitude = parseFloat(meanLongitude) + parseFloat(points[i].longitude);
    }
    meanLatitude = meanLatitude / points.length;
    meanLongitude = meanLongitude / points.length;

    return {
        'latitude': meanLatitude.toString(),
        'longitude': meanLongitude.toString()
    };
}

// Return all the businesses in a category.
function getBusinessesInCategory(city, category, callback) {
    utils.askDrill("select latitude, longitude from " + utils.datasetPath('business') + " where city='" + city + "' and true=repeated_contains(categories,'" + category + "')", function(answer) {
        var businesses = [];
        for (var i = 0; i < answer.rows.length; i++) {
            businesses.push({
                latitude: answer.rows[i].latitude,
                longitude: answer.rows[i].longitude
            });
        }
        callback(businesses);
    });
}

// Find businesses with more than 10 similar businesses in a radius of 3KM.
function getHotspots(businesses) {
    var distance; // Relative distance from other Restaurants
    var numberOfBusinessesForHotspot = 10;
    var hotspots = [];
    var businessesInHotspot = [];

    // For each businesses we're getting the number of businesses in a radius of 500m, if there are more than 10 competitors it is a hotspot.
    for (var i = 0; i < businesses.length; i++) {
        businessesNearby = 0;
        businessesInHotspot = [];
        for (var j = 0; j < businesses.length; j++) {
            distance = utils.distance(businesses[i].latitude, businesses[i].longitude, businesses[j].latitude, businesses[j].longitude) * 1000;
            if (distance < 500) { // The distance needs to be inferior to 500 meters to be a "cluster"
                businessesInHotspot.push(businesses[j]);
            }
        }
        if (businessesInHotspot.length > numberOfBusinessesForHotspot) {
            hotspots.push(businesses[i]);
            hotspots.push(centerPoint(businessesInHotspot));
        }
    }
    return hotspots;
}

module.exports = {
    get: function(parameters, callback) {
        // We need the category of the business for this algorithm.
        if (parameters.category === undefined) {
            callback({
                error: 'Parameter category is undefined'
            });
        } else {
            // Get all the businesses in the category.
            getBusinessesInCategory(parameters.city, parameters.category, function(businesses) {
                var hotspots = getHotspots(businesses); // Get the hotspots using the above algorithm.
                // The answer will be circles representing the hotspots.
                var answer = {
                    circles: []
                };
                for (var i = 0; i < hotspots.length; i++) {
                    answer.circles.push({
                        latitude: hotspots[i].latitude,
                        longitude: hotspots[i].longitude,
                        radius: 200,
                        options: {
                            stroke: false,
                            fillColor: "#FF0000"
                        }
                    });
                }
                callback(answer);
            });
        }
    },
    test: function() {
        getBusinessesInCategory('Phoenix', 'Fast Food', function(businesses) {
            var hotspots = getHotspots(businesses);
            console.log("Result of the algorithm: " + hotspots.length);
        });
    }
};
