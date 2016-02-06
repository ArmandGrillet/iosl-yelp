var utils = require('./utils'); // Functions used by multiple queries are in utils.

function getHostpots(hotspots) { //Function to make the array with unique values
    var uniqueStringHotspots = [];
    var uniqueHotspots = [];
    for (var i = 0; i < hotspots.length; i++) {
        if (uniqueStringHotspots.indexOf(JSON.stringify(hotspots[i])) == -1) {
            uniqueStringHotspots.push(JSON.stringify(hotspots[i]));
            uniqueHotspots.push(hotspots[i]);
        }
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
            relative_distance = utils.distance(latitude[i], longitude[i], latitude[j], longitude[j]); // calculating distance in KMs between two points on map
            if (relative_distance < 3 && relative_distance > 0) { //We have taken distance 1.5 KM if the shops are neighbouring
                hotspot_count++;
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
            for (j = 0; j < temp_hotspots.length; j++) {
                hotspots.push({
                    'latitude': temp_hotspots[j].latitude,
                    'longitude': temp_hotspots[j].longitude
                });
                hotspot_cluster_shop_list.push({ // Adding it to Cluster shop list
                    'latitude': temp_hotspots[j].latitude,
                    'longitude': temp_hotspots[j].longitude
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
            hotspot_cluster_shop_list = getHostpots(hotspot_cluster_shop_list);
        }
        if (hotspot_count > hotspot_count_value) { //Here we are adding the all the shops in the cluster list and sending them to the function to get the mean of there cluster
            var temp_coordinates = [];
            temp_coordinates = meanHotspotPoint(hotspot_cluster_shop_list);
            for (j = 0; j < temp_coordinates.length; j++) {
                hotspot_cluster_mean_point_list.push({
                    'latitude': temp_coordinates[j].latitude,
                    'longitude': temp_coordinates[j].longitude
                });
            }
        }
        hotspot_cluster_shop_list = [];
    }
    return getHostpots(meanHotspotsList(hotspot_cluster_mean_point_list)); // returning mean list of all clusters with unique value
    //return getHostpots(hotspots);
}

function meanHotspotsList(hotspot_cluster_mean_point_list) {
    return hotspot_cluster_mean_point_list;
}

function meanHotspotPoint(hotspot_cluster_shop_list) {
    var mean_latitude = 0;
    var mean_longitude = 0;
    var mean_hotspot_point = [];
    var no_of_shops = hotspot_cluster_shop_list.length;
    for (var i = 0; i < hotspot_cluster_shop_list.length; i++) {
        mean_latitude = parseFloat(mean_latitude) + parseFloat(hotspot_cluster_shop_list[i].latitude);
        mean_longitude = parseFloat(mean_longitude) + parseFloat(hotspot_cluster_shop_list[i].longitude);
    }
    mean_latitude = mean_latitude / no_of_shops;
    mean_longitude = mean_longitude / no_of_shops;

    mean_hotspot_point.push({
        'latitude': mean_latitude,
        'longitude': mean_longitude
    });
    return mean_hotspot_point;
}

function list_of_shops_in_a_category(city, business, callback) {
    utils.askDrill("select categories[0] as Categories_of_Restaurant_in_Phoenix, latitude, longitude from " + utils.datasetPath('business') + " where city='" + city + "' and categories[0]='" + business + "'", function(answer) {
        var longitude = [];
        var latitude = [];
        var count = 0;
        for (var i = 0; i < answer.rows.length; i++) {
            count++;
            longitude[count] = answer.rows[i].longitude;
            latitude[count] = answer.rows[i].latitude;
        }
        callback(get_hotspots(longitude, latitude));
    });
}

module.exports = {
    get: function(parameters, callback) {
        if (parameters.category === undefined) { // We only need to test name as city is a mandatory attribute {
            callback({
                error: 'Parameter category is undefined'
            });
        } else {
            list_of_shops_in_a_category(parameters.city, parameters.category, function(hotspot) {
                var answer = {
                    circles: [],
                    markers: []
                };
                for (var i = 0; i < hotspot.length; i++) {
                    answer.circles.push({
                        latitude: hotspot[i].latitude,
                        longitude: hotspot[i].longitude,
                        radius: 500,
                        popup: "Hostspot for " + parameters.category,
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
