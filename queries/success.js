var utils = require('./utils');
var fs = require('fs');

function success_factor(list_of_businesses) {
    var avg_checkin = 0;
    var avg_stars = 0;
    var avg_review_count = 0;
    var success_score = [];
    var no_of_businesses = list_of_businesses.length;
    var max_checkin = 0,
        max_stars = 0,
        max_review_count = 0;
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
    for (var k = 0; k < list_of_businesses.length; k++) {

        if (parseFloat(list_of_businesses[k].total_checkin) > parseFloat(max_checkin)) {
            max_checkin = parseFloat(list_of_businesses[k].total_checkin);
        }
        if (parseFloat(list_of_businesses[k].stars) > parseFloat(max_stars)) {
            max_stars = parseFloat(list_of_businesses[k].stars);
        }
        if (parseFloat(list_of_businesses[k].review_count) > max_review_count) {
            max_review_count = parseFloat(list_of_businesses[k].review_count);
        }
    }
    console.log("Max checkin, stars and review count is " + max_checkin + " , " + max_stars + " , " + max_review_count);

    console.log("Average Checkin :" + avg_checkin + " Avg Stars :" + avg_stars + "Average review count " + avg_review_count);
    for (var j = 0; j < list_of_businesses.length; j++) {
        success_score.push({
            'business_id': list_of_businesses[j].business_id,
            'business_name': list_of_businesses[j].business_name,
            'total_checkin': list_of_businesses[j].total_checkin,
            'stars': list_of_businesses[j].stars,
            'review_count': list_of_businesses[j].review_count,
            'latitude': list_of_businesses[j].latitude,
            'longitude': list_of_businesses[j].longitude,
            'score': ((parseFloat(list_of_businesses[j].total_checkin / max_checkin) + parseFloat(list_of_businesses[j].stars / max_stars) + parseFloat(list_of_businesses[j].review_count / max_review_count)) / 3)
        });
    }
    return success_score;
}
function retTransport(transport) {
    var transport_list = transport;
    return transport_list;
}

function getTransports(city, callback) {
    var transports = fs.readFileSync(utils.path('edinburgh_transport'), 'utf8'); // Reading the file yelp_academic_dataset_edinburgh_transport.json as a JSON file.
    callback(JSON.parse(transports));
}


function cal_success_business(city, business, callback) {
    utils.askDrill("select business_id, name, total_checkin, stars, review_count, latitude, longitude from " + utils.datasetPath('edinburgh_info') + " where category='" + business + "'", function(answer) {
        //  console.log("hello");
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
    var polygon = [
        [cx - half],
        [cy - half],
        [side],
        [side]
    ];
    return polygon;
}


module.exports = {
    get: function(parameters, callback) {
        if (parameters.business === undefined) { // We only need to test name as city is a mandatory attribute {
            callback({
                error: 'Parameter business is undefined'
            });
        } else {
            cal_success_business(parameters.city, parameters.business, function(list_of_businesses) {
                getTransports(parameters.city, function(transports) {
                    var answer = {
                        circles: [],
                        markers: []
                    };
                    var temp = transports[0];
                    var temp_nearest_transport = 0;
                    var transport_coordinates = [];
                    console.log("temp = " + temp.tags.highway);
                    var final_list = [];
                    for (var j = 0; j < list_of_businesses.length; j++) {
                        for (var i = 0; i < transports.length; i++) {
                            var distances = utils.distance(transports[i].lat, transports[i].lon, list_of_businesses[j].latitude, list_of_businesses[j].longitude);
                            if (i === 0) {
                                temp_nearest_transport = distances;
                            }
                            if (distances < temp_nearest_transport) {
                                temp_nearest_transport = distances;
                                transport_coordinates = [];
                                transport_coordinates.push({
                                    latitude: transports[i].lat,
                                    longitude: transports[i].lon
                                    //name: transports[i].tags[2]
                                });
                            }
                        }
                        final_list.push({
                            business: list_of_businesses[j],
                            transport_list: transport_coordinates[0],
                            distance: temp_nearest_transport
                        });
                    }

                    for (var l = 0; l < final_list.length; l++) {
                    }

                    for (var m = 0; m < final_list.length; m++) {
                        //squareInCircle(final_list[m].business.latitude, final_list[m].business.longitude, 200);
                        answer.circles.push({
                            latitude: final_list[m].business.latitude,
                            longitude: final_list[m].business.longitude,
                            radius: 100,
                            popup: final_list[m].business.business_name + ": Success score of " + parseFloat(final_list[m].business.score).toFixed(2) + ", nearest transport is " + parseFloat(final_list[m].distance * 1000).toFixed(2) + " meters away",
                            options: {
                                stroke: false,
                                fillColor: ((parseFloat(final_list[m].business.score) > 0.66 && parseFloat(final_list[m].business.score) <= 1) ? "#FF00FF" : (parseFloat(final_list[m].business.score) > 0 && parseFloat(final_list[m].business.score) < 0.3) ? "#0000FF" : "#FF0000")
                            }
                        });
                    }

                    for (var n = 0; n < final_list.length; n++) {
                        answer.markers.push({
                            latitude: final_list[n].transport_list.latitude,
                            longitude: final_list[n].transport_list.longitude,
                            popup: 'Transport'
                        });
                    }
                    callback(answer);
                });
            });
        }
    },
    test: function() {
        cal_success_business('Edinburgh', 'Fast Food', function(list_of_businesses) {
            getTransports('Edingurgh', function(transports) {
                var temp = transports[0];
                var temp_nearest_transport = 0;
                var transport_coordinates = [];
                console.log("temp is " + temp.lat);
                var final_list = [];
                for (var j = 0; j < list_of_businesses.length; j++) {
                    for (var i = 0; i < transports.length; i++) {
                        var distances = utils.distance(transports[i].lat, transports[i].lon, list_of_businesses[j].latitude, list_of_businesses[j].longitude);
                        if (i === 0) {
                            temp_nearest_transport = distances; //console.log("Distance is " + temp_nearest_transport);
                        }
                        if (distances < temp_nearest_transport) {
                            temp_nearest_transport = distances;
                            transport_coordinates = [];
                            transport_coordinates.push({
                                latitude: transports[i].lat,
                                longitude: transports[i].lon,
                                name: transports[i].tags
                            });
                            //console.log("Inside if Distance from " + transport_coordinates.latitude);
                        }
                    }
                    final_list.push({
                        business: list_of_businesses[j],
                        transport: transport_coordinates,
                        distance: temp_nearest_transport
                    });
                }

                for (var l = 0; l < final_list.length; l++) {
                    console.log("Hello " + final_list[l].transport.name);
                }
                console.log("Length is " + list_of_businesses.length);
                for (var k = 0; k < list_of_businesses.length; k++) {
                    console.log(list_of_businesses[k].business_id + " , " + list_of_businesses[k].business_name + " Score of the business: " + list_of_businesses[k].score);
                }

            });
        });
    }
};
