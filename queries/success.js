/* Returns the success of all the businesses in a category. */

var utils = require('./utils'); // Functions used by multiple queries are in utils.
var fs = require('fs'); // We need to read the features of a city contained in a file.

/*
Function to get the number of checkins per week for a business.
    id = id of the business
    data = all the checkins given by Apache Drill
*/
function checkinfsForId(id, data) {
    for (var i = 0; i < data.rows.length; i++) {
        if (id == data.rows[i].business_id) {
            var checkins = 0;
            var unformattedCheckins = JSON.parse(data.rows[i].checkin_info);
            for (var key in unformattedCheckins) {
                checkins += unformattedCheckins[key];
            }
            return checkins;
        }
    }
    return 0;
}

/*
Asynchronous function to get all the business in a specified category in a city.
We process the businesses to have a nice JSON containing all the information we need (including the number of checkins of a business).
Parameters:
    city = name of the city where we want to find the businesses
    category = category of the businesses searched
    callback = what to do once we have processed the businesses, we give the processed results to this function
*/
function getBusinesses(city, category, callback) {
    /*
    We use Apache Drill to query the dataset, we use it two times to get:
        - All the checkins
        - All the businesses in the city in a specific category.
    */
    utils.askDrill("SELECT table_business.business_id, table_checkin.checkin_info from " + utils.datasetPath('checkin') + " AS table_checkin INNER JOIN " + utils.datasetPath('business') + " AS table_business ON table_checkin.business_id = table_business.business_id WHERE table_business.city = '" + city + "' AND true=repeated_contains(table_business.categories,'" + category + "')", function(checkins) {
        utils.askDrill("select business_id, name, total_checkins, stars, review_count, latitude, longitude from " + utils.datasetPath('business') + " WHERE city='" + city + "' AND true=repeated_contains(categories,'" + category + "')", function(rawBusinesses) {
            var businesses = [];
            for (var i = 0; i < rawBusinesses.rows.length; i++) {
                businesses.push({
                    'id': rawBusinesses.rows[i].business_id,
                    'name': rawBusinesses.rows[i].name,
                    'latitude': rawBusinesses.rows[i].latitude,
                    'longitude': rawBusinesses.rows[i].longitude,
                    'stars': rawBusinesses.rows[i].stars,
                    'reviews': rawBusinesses.rows[i].review_count,
                    'checkins': checkinfsForId(rawBusinesses.rows[i].business_id, checkins)
                });
            }
            callback(addSuccess(businesses));
        });
    });
}

/*
Function to get the nearest element on a list to a business.
Parameters:
    - business: JSON containing a latitude and longitude.
    - list: array of JSON objects having a lat and lon attributes.
*/

function getDistanceToNearestElement(business, list) {
    var nearestElement = {};
    var distanceToElement;
    var nearestDistance;
    if (list.length > 0) {
        nearestDistance = utils.distance(list[0].lat, list[0].lon, business.latitude, business.longitude);
    } else {
        return {};
    }
    for (var i = 0; i < list.length; i++) {
        distanceToElement = utils.distance(list[i].lat, list[i].lon, business.latitude, business.longitude);
        if (distanceToElement <= nearestDistance) {
            nearestDistance = distanceToElement;
            nearestElement = list[i];
        }
    }
    return nearestDistance;
}

/* Returns all the features from a list that are in a 150m radius from a business */
function getNumberOfFeaturesIn150Radius(type, business, list) {
    var elementsInRadius = 0;
    var distance;
    for (var i = 0; i < list.length; i++) {
        distance = utils.distance(list[i].lat, list[i].lon, business.latitude, business.longitude) * 1000;
        if (distance <= 150) {
            elementsInRadius++;
        }
    }
    return elementsInRadius;
}

/* Add the success to a list of businesses */
function addSuccess(businesses) {
    var averageCheckins = 0,
        averageStars = 0,
        averageReviews = 0;
    var maxCheckins = 0,
        maxStars = 0,
        maxReviews = 0;
    var businessesWithSuccess = [];

    // Calculating the mean of checkins, stars and review counts of the businesses.
    for (var i = 0; i < businesses.length; i++) {
        averageCheckins += parseFloat(businesses[i].checkins);
        averageStars += parseFloat(businesses[i].stars);
        averageReviews += parseFloat(businesses[i].reviews);
    }

    averageCheckins /= businesses.length;
    averageStars /= businesses.length;
    averageReviews /= businesses.length;

    // Normalizing the values
    for (i = 0; i < businesses.length; i++) {
        if (parseFloat(businesses[i].checkins) > parseFloat(maxCheckins)) {
            maxCheckins = parseFloat(businesses[i].checkins);
        }
        if (parseFloat(businesses[i].stars) > parseFloat(maxStars)) {
            maxStars = parseFloat(businesses[i].stars);
        }
        if (parseFloat(businesses[i].reviews) > maxReviews) {
            maxReviews = parseFloat(businesses[i].reviews);
        }
    }

    for (i = 0; i < businesses.length; i++) {
        businessesWithSuccess.push({
            'name': businesses[i].name,
            'latitude': businesses[i].latitude,
            'longitude': businesses[i].longitude,
            'success': ((parseFloat(businesses[i].checkins / maxCheckins) + parseFloat(businesses[i].stars / maxStars) + parseFloat(businesses[i].reviews / maxReviews)) / 3)
        });
    }
    return businessesWithSuccess;
}

module.exports = {
    get: function(parameters, callback) {
        // We need to know the category of the businesses.
        if (parameters.category === undefined) {
            callback({
                error: 'Parameter category is undefined'
            });
        } else {
            /* Get all the features using the files in static/features */
            fs.readFile(utils.featuresPath(parameters.city), 'utf8', function(err, data) {
                // Not able to read the file
                if (err) {
                    callback({
                        error: err
                    });
                }
                var source = JSON.parse(data); // Parsing the fatures to manipulate them.
                // Obtains the businesses in a city for a certain category.
                getBusinesses(parameters.city, parameters.category, function(businesses) {
                    // The answer is composed of circles with a marker in the middle.
                    var answer = {
                        markers: [],
                        circles: []
                    };
                    var markerPopup = ""; // Thext of the marker's popup.
                    var circleColor = ""; // Color of the cirle depending on the success of the business.
                    // For each business we create a circle and a marker.
                    for (var i = 0; i < businesses.length; i++) {
                        answer.markers.push({
                            popup: businesses[i].name,
                            latitude: businesses[i].latitude,
                            longitude: businesses[i].longitude
                        });
                        markerPopup = businesses[i].success + " ";
                        // For each feature we display the number if there is features in a 150m radius around the business.
                        for (var j = 0; j < source.types.length; j++) {
                            if (getNumberOfFeaturesIn150Radius(source.types[j], businesses[i], source[source.types[j]]) > 0) {
                                markerPopup += getNumberOfFeaturesIn150Radius(source.types[j], businesses[i], source[source.types[j]]) + " " + source.types[j] + ", ";
                            }
                        }

                        // Color depending on the business' success
                        if (parseFloat(businesses[i].success) < 0.3) {
                            circleColor = "#0000ff";
                        } else if (parseFloat(businesses[i].success) < 0.5) {
                            circleColor = "#ff8c00";
                        } else {
                            circleColor = "#ff0000";
                        }

                        // Circle around the marker thus same latitude/longitude.
                        answer.circles.push({
                            latitude: businesses[i].latitude,
                            longitude: businesses[i].longitude,
                            radius: 150,
                            popup: markerPopup,
                            options: {
                                stroke: false,
                                fillColor: circleColor
                            }
                        });
                    }
                    callback(answer);
                });
            });
        }
    },
    test: function() {
        console.log('Test not yet implemented');
    }
};
