var utils = require('./utils');
var fs = require('fs');

function success_factor(list_of_businesses) {
    var avg_checkin = 0;
    var avg_stars = 0;
    var avg_review_count = 0;
    var success_score = [];
    var no_of_businesses = list_of_businesses.length;
    var max_checkins = 0,
        max_stars = 0,
        max_review_counts = 0;

    //calculating the mean of checkin, stars and review count of a business category
    for (var i = 0; i < list_of_businesses.length; i++) {
        avg_checkin += parseFloat(list_of_businesses[i].total_checkin);
        avg_stars += parseFloat(list_of_businesses[i].stars);
        avg_review_count += parseFloat(list_of_businesses[i].review_count);
    }
    avg_checkin /= no_of_businesses;
    avg_stars /= no_of_businesses;
    avg_review_count /= no_of_businesses;

    //Normalizing the values
    for (i = 0; i < list_of_businesses.length; i++) {
        if (parseFloat(list_of_businesses[i].total_checkin) > parseFloat(max_checkins)) {
            max_checkins = parseFloat(list_of_businesses[i].total_checkin);
        }
        if (parseFloat(list_of_businesses[i].stars) > parseFloat(max_stars)) {
            max_stars = parseFloat(list_of_businesses[i].stars);
        }
        if (parseFloat(list_of_businesses[i].review_count) > max_review_counts) {
            max_review_counts = parseFloat(list_of_businesses[i].review_count);
        }
    }

    console.log("Max checkin, stars and review count is " + max_checkins + " , " + max_stars + " , " + max_review_counts);
    console.log("Average Checkin :" + avg_checkin + " Avg Stars :" + avg_stars + "Average review count " + avg_review_count);

    for (i = 0; i < list_of_businesses.length; i++) {
        success_score.push({
            'business_id': list_of_businesses[i].business_id,
            'business_name': list_of_businesses[i].business_name,
            'total_checkin': list_of_businesses[i].total_checkin,
            'stars': list_of_businesses[i].stars,
            'review_count': list_of_businesses[i].review_count,
            'latitude': list_of_businesses[i].latitude,
            'longitude': list_of_businesses[i].longitude,
            'score': ((parseFloat(list_of_businesses[i].total_checkin / max_checkins) + parseFloat(list_of_businesses[i].stars / max_stars) + parseFloat(list_of_businesses[i].review_count / max_review_counts)) / 3)
        });
    }
    return success_score;
}

function getTransports(city, callback) {
    var transports = fs.readFileSync(utils.path('edinburgh_metro_bus'), 'utf8'); // Reading the file yelp_academic_dataset_edinburgh_transport.json as a JSON file.
    callback(JSON.parse(transports));
}
function getMuseums(city, callback) {
    var museums = fs.readFileSync(utils.path('edinburgh_attractions'), 'utf8'); // Reading the file yelp_academic_dataset_edinburgh_museum.json as a JSON file.
    callback(JSON.parse(museums));
}
function getLiquor(city, callback) {
    var liquors = fs.readFileSync(utils.path('edinburgh_liquor'), 'utf8'); // Reading the file yelp_academic_dataset_edinburgh_museum.json as a JSON file.
    callback(JSON.parse(liquors));
}

function cal_success_business(city, business, callback) {
    console.log("Hello before");
    utils.askDrill("select business_id, name, total_checkin, stars, review_count, latitude, longitude from " + utils.datasetPath('edinburgh_info') + " where category='" + business + "'", function(answer) {
        var list_of_businesses = [];
        for (var i = 0; i < answer.rows.length; i++) {
            list_of_businesses.push({
                'business_id': answer.rows[i].business_id,
                'business_name': answer.rows[i].name,
                'total_checkin': answer.rows[i].total_checkin,
                'stars': answer.rows[i].stars,
                'review_count': answer.rows[i].review_count,
                'latitude': answer.rows[i].latitude,
                'longitude': answer.rows[i].longitude
            });
        }
        callback(success_factor(list_of_businesses));
    });
}

function squareInCircle(cx, cy, radius) {
    var side = Math.sqrt(radius * radius * 2); // calc side length of square
    var half = side * 0.5; // position offset
    polygon = [
        [cx - half],
        [cy - half],
        [side],
        [side]
    ];
    return polygon;
}

function getNearestElement(business, list) {
    var nearestElement = {};
    var distanceToElement;
    var tempNearestElement;
    if (list.length > 0) {
        tempNearestElement = utils.distance(list[0].lat, list[0].lon, business.latitude, business.longitude);
    } else {
        return {};
    }
    for (var i = 0; i < list.length; i++) {
        distanceToElement = utils.distance(list[i].lat, list[i].lon, business.latitude, business.longitude);
        if (distanceToElement <= tempNearestElement) {
            tempNearestElement = distanceToElement;
            nearestElement = list[i];
        }
    }
    return nearestElement;
}

function getNearestElements(business, transports, museums, liquors) {
    // Nearest transport
    var unformattedNearestTransport = getNearestElement(business, transports);
    var nearestTransport = {
        latitude: unformattedNearestTransport.lat,
        longitude: unformattedNearestTransport.lon,
        type: unformattedNearestTransport.railway,
        distance: utils.distance(unformattedNearestTransport.lat, unformattedNearestTransport.lon, business.latitude, business.longitude),
    };

    // Nearest museum
    var unformattedNearestMuseum = getNearestElement(business, museums);
    var nearestMuseum = {
        latitude: unformattedNearestMuseum.lat,
        longitude: unformattedNearestMuseum.lon,
        type: "Museum",
        distance: utils.distance(unformattedNearestMuseum.lat, unformattedNearestMuseum.lon, business.latitude, business.longitude)
    };

    // Nearest liquor store
    var unformattedNearestLiquorStore = getNearestElement(business, liquors);
    var nearestLiquorStore = {
        latitude: unformattedNearestLiquorStore.lat,
        longitude: unformattedNearestLiquorStore.lon,
        type: "Liquor Shop",
        distance: utils.distance(unformattedNearestLiquorStore.lat, unformattedNearestLiquorStore.lon, business.latitude, business.longitude)
    };

    return {
        business: business,
        transport: nearestTransport,
        museum: nearestMuseum,
        liquor: nearestLiquorStore
    };
}


module.exports = {
    get: function(parameters, callback) {
        if (parameters.business === undefined) { // We only need to test name as city is a mandatory attribute {
            callback({
                error: 'Parameter business is undefined'
            });
        } else {
            cal_success_business(parameters.city, parameters.business, function(businesses) {
                getTransports(parameters.city, function(transports) {
                    getMuseums(parameters.city, function(museums) {
                        getLiquor(parameters.city, function(liquors) {
                            var answer = {
                                circles: [],
                                markers: []
                            };

                            var list = [];
                            for (var i = 0; i < businesses.length; i++) {
                                list.push(getNearestElements(businesses[i], transports, museums, liquors));
                            }

                            for (i = 0; i < list.length; i++) {
                                //squareInCircle(final_list[i].business.latitude, final_list[i].business.longitude, 200);
                                answer.circles.push({
                                    latitude: list[i].business.latitude,
                                    longitude: list[i].business.longitude,
                                    radius: 150,
                                    popup: list[i].business.business_name + " \n , Success score: " + parseFloat(list[i].business.score).toFixed(2) + " \n " + list[i].transport.type + " : " + parseFloat(list[i].transport.distance * 1000).toFixed(2) + " meters away, \n Attraction :  " + parseFloat(list[i].museum.distance * 1000).toFixed(2) + " meters away, Liquor shop : " + parseFloat(list[i].liquor.distance * 1000).toFixed(2) + " meters away",
                                    options: {
                                        stroke: false,
                                        fillColor: ((parseFloat(list[i].business.score) > 0.66 && parseFloat(list[i].business.score) <= 1) ? "#ffff00" : (parseFloat(list[i].business.score) > 0 && parseFloat(list[i].business.score) < 0.34) ? "#0000FF" : "#FF0000")
                                    }
                                });
                                answer.markers.push({
                                    latitude: list[i].transport.latitude,
                                    longitude: list[i].transport.longitude,
                                    popup: list[i].transport.type
                                });
                            }

                            callback(answer);
                        });
                    });
                });
            });
        }
    },
    test: function() {
        cal_success_business('Edinburgh', 'Fast Food', function(businesses) {
            getTransports('Edingurgh', function(transports) {
                var i, j;
                var temp_nearest_transport = 0;
                var transport_coordinates = [];
                var final_list = [];
                for (i = 0; i < businesses.length; i++) {
                    if (transports.railway === 'bus_stop') {
                        for (j = 0; j < transports.length; j++) {
                            var distances = utils.distance(transports[j].lat, transports[j].lon, businesses[i].latitude, businesses[i].longitude);
                            if (j === 0) {
                                temp_nearest_transport = distances;
                            }
                            if (distances < temp_nearest_transport) {
                                temp_nearest_transport = distances;
                                transport_coordinates = [];
                                transport_coordinates.push({
                                    latitude: transports[j].lat,
                                    longitude: transports[j].lon,
                                    t_type: transports[j].railway
                                });
                                console.log("Inside if Distance from " + transport_coordinates[0].latitude);
                            }
                        }
                    }
                    final_list.push({
                        business: businesses[i],
                        transport: transport_coordinates,
                        distance: temp_nearest_transport
                    });
                }

                for (i = 0; i < final_list.length; i++) {
                    console.log("Hello " + final_list[i].transport[0].latitude);
                }
                console.log("Length is " + list_of_businesses.length);
                for (i = 0; i < list_of_businesses.length; i++) {
                    console.log(list_of_businesses[i].business_id + " , " + list_of_businesses[i].business_name + " Score of the business: " + list_of_businesses[i].score);
                }

            });
        });
    }
};
