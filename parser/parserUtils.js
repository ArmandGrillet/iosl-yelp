// Useful features used multiple times in parser.

/*jslint node: true */
'use strict';
var utils = require('../queries/utils'); // We need the utils functions used by the queries.
// tcp-port-used allows us to check if a port is used, useful to see if Apache Drill is running.
var tcpPortUsed = require('tcp-port-used');

module.exports = {
    // Add the success to every businesses given as a parameter using their number of checkins, stars and reviews.
    addSuccess: function(businesses) {
        var averageCheckins = 0;
        var averageStars = 0;
        var averageReviews = 0;
        var businessesWithSuccess = [];
        var maxCheckins = 0,
            maxStars = 0,
            maxReviews = 0;

        // Calculating the mean of checkin, stars and review count of a business category
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
    },

    // Tells if Apache Drill is running.
    isDrillRunning: function(callback) {
        tcpPortUsed.check(8047) // localhost:8047 = Apache Drill
            .then(function(inUse) {
                callback(inUse);
            }, function(err) {
                callback(false);
            });
    },

    /*
    Function to get the number of checkins per week for a business.
        id = id of the business
        data = all the checkins given by Apache Drill
    */
    checkinsForId: function(id, data) {
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
    },
    /*
    Asynchronous function to get all the business in a specified category in a city.
    We process the businesses to have a nice JSON containing all the information we need (including the number of checkins of a business).
    Parameters:
        city = name of the city where we want to find the businesses
        category = category of the businesses searched
        callback = what to do once we have processed the businesses, we give the processed results to this function
    */
    getBusinesses: function(city, category, callback) {
        /*
        We use Apache Drill to query the dataset, we use it two times to get:
            - All the checkins
            - All the businesses in the city in a specific category.
        */
        var self = this;
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
                        'checkins': self.checkinsForId(rawBusinesses.rows[i].business_id, checkins)
                    });
                }
                callback(businesses);
            });
        });
    },
    /*
    Function to get the nearest element on a list to a business.
    Parameters:
        - business: JSON containing a latitude and longitude.
        - list: array of JSON objects having a lat and lon attributes.
    */
    getDistanceToNearestElement: function(business, list) {
        var nearestElement = {};
        var distanceToElement;
        var nearestDistance;
        if (list.length > 0) {
            nearestDistance = utils.distance(list[0].latitude, list[0].longitude, business.latitude, business.longitude);
        } else {
            return {};
        }
        for (var i = 0; i < list.length; i++) {
            distanceToElement = utils.distance(list[i].latitude, list[i].longitude, business.latitude, business.longitude);
            if (distanceToElement <= nearestDistance) {
                nearestDistance = distanceToElement;
                nearestElement = list[i];
            }
        }
        return nearestDistance;
    },
    // Function to get the number of features in a list that are in the radius given to a business
    getNumberOfFeaturesforRadius: function(business, radius, list) {
        var elementsInRadius = 0;
        var distance;
        for (var i = 0; i < list.length; i++) {
            distance = utils.distance(list[i].latitude, list[i].longitude, business.latitude, business.longitude) * 1000;
            if (distance <= radius) {
                elementsInRadius++;
            }
        }
        return elementsInRadius;
    }
};
