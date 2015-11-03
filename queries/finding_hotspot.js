var utils = require('./utils');

// Write the inner functions here.
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

function uniqueHotspots(hotspots) { //Function to make the array with unique values
    var uniqueStringHotspots = [];
    var uniqueHotspots = [];
    for (
    var hotspot of hotspots) {
    if (uniqueStringHotspots.indexOf(JSON.stringify(hotspot)) == -1) {
        uniqueStringHotspots.push(JSON.stringify(hotspot));
        uniqueHotspots.push(hotspot);
    }
    }
    for (
    var hotspot of uniqueHotspots){
    console.log("Coordinates are " + hotspot.latitude + "and " + hotspot.longitude);
    }
    return uniqueHotspots;
}

function get_hotspots(longitude, latitude) {
    var relative_distance; //Relative distance from other Restaurants
    var hotspot_count_value = 10;
    var hotspots = [];
    var temp_hotspots = [];
    var hotspot_cluster_shop_list = [];
    var hotspot_cluster_mean_point_list = [];
    var hotspot_count = 0; //Hotspot count to count the number of shops around for which we have chosen 5, so if cluster has more than 5 shops it's an Hotspot region
    for (var i = 0; i < longitude.length; i++) { //loop to iterate through the list of latitudes and longitudes and calculate distance between them
        hotspot_count = 0;
        for (var j = 0; j < longitude.length; j++) {
            relative_distance = distance(latitude[i], longitude[i], latitude[j], longitude[j], 'K'); // calculating distance in KMs between two points on map
            if (relative_distance < 3 && relative_distance > 0) { //We have taken distance 1.5 KM if the shops are neighbouring
                hotspot_count = hotspot_count + 1;
                temp_hotspots.push({
                    'latitude': latitude[j],
                    'longitude': longitude[j]
                });
                if (hotspot_count > hotspot_count_value) { //capturing the coordinates when it is considered a hotspot cluster, '=' because we just want to add once
                    hotspot_cluster_shop_list.push({ //Adding it to Cluster shop list
                        'latitude': latitude[j],
                        'longitude': longitude[j]
                    });
                    hotspots.push({
                        'latitude': latitude[j],
                        'longitude': longitude[j]
                    });
                }
            }
        }
        if (hotspot_count > hotspot_count_value) {
            for(
            var temp of temp_hotspots){
            hotspots.push({
                'latitude': temp.latitude,
                'longitude': temp.longitude
            });
            hotspot_cluster_shop_list.push({ // Adding it to Cluster shop list
                'latitude': temp.latitude,
                'longitude': temp.longitude
            });
            }
        } else {
            hotspot_cluster_shop_list = [];
        }
        temp_hotspots = [];
        if (hotspot_count > hotspot_count_value) { //capturing the coordinates of base shop from where we were calculating distances from other shops
            hotspots.push({
                'latitude': latitude[i],
                'longitude': longitude[i]
            });
            hotspot_cluster_shop_list.push({
                'latitude': latitude[i],
                'longitude': longitude[i]
            });
            hotspot_cluster_shop_list = uniqueHotspots(hotspot_cluster_shop_list);
            console.log('Found a cluster with ' + hotspot_count + ' shops ' + hotspot_cluster_shop_list.length);
        }
        if (hotspot_count > hotspot_count_value) { //Here we are adding the all the shops in the cluster list and sending them to the function to get the mean of there cluster
            var temp_coordinates = [];
            temp_coordinates = meanHotspotPoint(hotspot_cluster_shop_list);
            for(
            var temp_points of temp_coordinates){
            hotspot_cluster_mean_point_list.push({
                'latitude': temp_points.latitude,
                'longitude': temp_points.longitude
            });}
            console.log("Cluster list is " + hotspot_cluster_mean_point_list.length);
        }
        hotspot_cluster_shop_list = [];
    }
    return uniqueHotspots(meanHotspotsList(hotspot_cluster_mean_point_list)); // returning mean list of all clusters with unique value
    //return uniqueHotspots(hotspots);
}

function meanHotspotsList(hotspot_cluster_mean_point_list) {
    return hotspot_cluster_mean_point_list;
}

function meanHotspotPoint(hotspot_cluster_shop_list) {
    var mean_latitude = 0;
    var mean_longitude = 0;
    var mean_hotspot_point = [];
    var no_of_shops = hotspot_cluster_shop_list.length;
    for(
    var hotspot_sublist of hotspot_cluster_shop_list){
    mean_latitude = parseFloat(mean_latitude) + parseFloat(hotspot_sublist.latitude);
    mean_longitude = parseFloat(mean_longitude) + parseFloat(hotspot_sublist.longitude);
    //console.log("Mean Latitude: " + mean_latitude);
    }
    mean_latitude = mean_latitude / no_of_shops;
    mean_longitude = mean_longitude / no_of_shops;

    mean_hotspot_point.push({
        'latitude': mean_latitude,
        'longitude': mean_longitude
    });
    for(
    var mean of mean_hotspot_point){
    console.log("Mean List " + mean.latitude + " Mean longitude " + mean.longitude);
    }
    return mean_hotspot_point;
}

function list_of_shops_in_a_category(city, business, callback) {
    utils.askDrill("select categories[0] as Categories_of_Restaurant_in_Phoenix, latitude, longitude from " + utils.datasetPath('business') + " where city='" + city + "' and categories[0]='" + business + "'", function(answer) {
        var longitude = new Array();
        var latitude = new Array();
        var count = 0;
        for (
        var row of answer.rows) {
        count++;
        longitude[count] = row.longitude;
        latitude[count] = row.latitude;
        }
        callback(get_hotspots(longitude, latitude));
    });
}

module.exports = {
    get: function(parameters, callback) {
        if (parameters.business === undefined) { // We only need to test name as city is a mandatory attribute {
            callback({
                error: 'Parameter business is undefined'
            });
        } else {
            list_of_shops_in_a_category(parameters.city, parameters.business, function(hotspot) {
                var answer = {
                    circles: [],
                    markers: []
                };
                for (var i = 0; i < hotspot.length; i++) {
                    answer.circles.push({
                        latitude: hotspot[i].latitude,
                        longitude: hotspot[i].longitude,
                        radius: 500,
                        popup: "Hostspot for " + parameters.business,
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
        list_of_shops_in_a_category('Phoenix', 'Fast Food', function(hotspot) {
            console.log("Result of the algorithm: " + hotspot.length);
        });
    }
};
