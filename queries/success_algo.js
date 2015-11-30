var utils = require('./utils');
var fs = require('fs');

function distance(lat1, lon1, lat2, lon2, unit) { //function to calculate the distance between two coordinates
    var radlat1 = Math.PI * lat1 / 180;
    var radlat2 = Math.PI * lat2 / 180;
    var radlon1 = Math.PI * lon1 / 180;
    var radlon2 = Math.PI * lon2 / 180;
    var theta = lon1 - lon2;
    var radtheta = Math.PI * theta / 180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;

    if (unit == 'K') {
        dist = dist * 1.609344;
    }

    if (unit == 'N') {
        dist = dist * 0.8684;
    }
    return dist;
}

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
    var transports = fs.readFileSync(utils.path('edinburgh_metro_bus'), 'utf8'); // Reading the file yelp_academic_dataset_edinburgh_transport.json as a JSON file.
    callback(JSON.parse(transports));
}


function cal_success_business(city, business, callback) {
    console.log("Hello before");
    utils.askDrill("select business_id, name, total_checkin, stars, review_count, latitude, longitude from " + utils.datasetPath('edinburgh_info') + " where category='" + business + "'", function(answer) {
        //  console.log("hello");
        var list_of_businesses = [];
        for (
        var row of answer.rows) {
        list_of_businesses.push({
            'business_id': row.business_id,
            'business_name': row.name,
            'total_checkin': row.total_checkin,
            'stars': row.stars,
            'review_count': row.review_count,
            'latitude': row.latitude,
            'longitude': row.longitude
        });
        }
        callback(success_factor(list_of_businesses));
    });
}

function squareInCircle(cx, cy, radius) {

    var side = Math.sqrt(radius * radius * 2), // calc side length of square
        half = side * 0.5; // position offset
    polygon = [
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
                    console.log("temp is " + temp.railway);
                    var final_list = [];
                    for (var j = 0; j < list_of_businesses.length; j++) {
                        for (var i = 0; i < transports.length; i++) {
                            var distances = distance(transports[i].lat, transports[i].lon, list_of_businesses[j].latitude, list_of_businesses[j].longitude, 'K');
                            if (i === 0) {
                                temp_nearest_transport = distances;
                            }
                            if (distances < temp_nearest_transport) {
                                temp_nearest_transport = distances;
                                transport_coordinates = [];
                                transport_coordinates.push({
                                    latitude: transports[i].lat,
                                    longitude: transports[i].lon,
                                    t_type: transports[i].railway
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
                            radius: 200,
                            popup: final_list[m].business.business_name + " and success score is " + parseFloat(final_list[m].business.score).toFixed(2) + " and the " + final_list[m].transport_list.t_type + " is " + parseFloat(final_list[m].distance * 1000).toFixed(2) + " meters away",
                            options: {
                                stroke: false,
                                fillColor: ((parseFloat(final_list[m].business.score) > 0.66 && parseFloat(final_list[m].business.score) <= 1) ? "#000000" : (parseFloat(final_list[m].business.score) > 0 && parseFloat(final_list[m].business.score) < 0.3) ? "#0000FF" : "#FF0000")
                            }
                        });
                    }

                    for (var n = 0; n < final_list.length; n++) {
                        answer.markers.push({
                            latitude: final_list[n].transport_list.latitude,
                            longitude: final_list[n].transport_list.longitude,
                            popup: final_list[n].transport_list.t_type
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
                console.log("temp is " + temp.railway);
                var final_list = [];
                for (var j = 0; j < list_of_businesses.length; j++) {
                    if (transports.railway === 'bus_stop') {
                        for (var i = 0; i < transports.length; i++) {
                            var distances = distance(transports[i].lat, transports[i].lon, list_of_businesses[j].latitude, list_of_businesses[j].longitude, 'K');
                            if (i === 0) {
                                temp_nearest_transport = distances; //console.log("Distance is " + temp_nearest_transport);
                            }
                            if (distances < temp_nearest_transport) {
                                temp_nearest_transport = distances;
                                transport_coordinates = [];
                                transport_coordinates.push({
                                    latitude: transports[i].lat,
                                    longitude: transports[i].lon,
                                    t_type: transports[i].railway
                                });
                                console.log("Inside if Distance from " + transport_coordinates[0].latitude);
                            }
                        }
                    }
                    final_list.push({
                        business: list_of_businesses[j],
                        transport: transport_coordinates,
                        distance: temp_nearest_transport
                    });
                }

                for (var l = 0; l < final_list.length; l++) {
                    console.log("Hello " + final_list[l].transport[0].latitude);
                }
                console.log("Length is " + list_of_businesses.length);
                for (var k = 0; k < list_of_businesses.length; k++) {
                    console.log(list_of_businesses[k].business_id + " , " + list_of_businesses[k].business_name + " Score of the business: " + list_of_businesses[k].score);
                }

            });
        });
    }
};
