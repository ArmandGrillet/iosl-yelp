'use strict';

var path = require('path');
var request = require('request');

function distance(lat1, lon1, lat2, lon2, unit) {       //function to calculate the distance between two coordinates
    var radlat1 = Math.PI * lat1/180
    var radlat2 = Math.PI * lat2/180
    var radlon1 = Math.PI * lon1/180
    var radlon2 = Math.PI * lon2/180
    var theta = lon1-lon2
    var radtheta = Math.PI * theta/180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist)
    dist = dist * 180/Math.PI
    dist = dist * 60 * 1.1515

    if (unit == 'K') { 
        dist = dist * 1.609344 
    }
    
    if (unit == 'N') { 
        dist = dist * 0.8684 
    }
    return dist
}

function uniqueHotspots(hotspots) { //Function to make the array with unique values
    var uniqueStringHotspots = [];
    var uniqueHotspots = [];
    for (var hotspot of hotspots) {
        if (uniqueStringHotspots.indexOf(JSON.stringify(hotspot)) == -1) {
            uniqueStringHotspots.push(JSON.stringify(hotspot));
            uniqueHotspots.push(hotspot);
        }
    }
    return uniqueHotspots;
}

function get_hotspots(longitude, latitude) {
    var relative_distance;              //Relative distance from other Restaurants
    var hotspots = [];
    var hotspot_count=0;                    //Hotspot count to count the number of shops around for which we have chosen 5, so if cluster has more than 5 shops it's an Hotspot region
    for (var i=1;i<longitude.length;i++) { //loop to iterate through the list of latitudes and longitudes and calculate distance between them 
        hotspot_count=0
        for(var j=1; j<longitude.length; j++) {
            relative_distance =  distance(latitude[i], longitude[i], latitude[j], longitude[j], 'K'); // calculating distance in KMs between two points on map
            if (relative_distance<3 && relative_distance>0) { //We have taken distance 3KM if the shops are neighbouring
                hotspot_count=hotspot_count+1;                              
            }
            if (hotspot_count == 5) { //capturing the coordinates when it is considered a hotspot cluster, '=' because we just want to add once
                hotspots.push({
                    'latitude': latitude[j],
                    'longitude': longitude[j]
                });
            }
        }                                       
        if (hotspot_count > 4) { //capturing the coordinates of base shop from where we were calculating distances from other shops
            hotspots.push({
                'latitude': latitude[i],
                'longitude': longitude[i]
            });
            console.log('Found a cluster with ' + hotspot_count + ' shops');
        }
    }

    return uniqueHotspots(hotspots);
}

function datasetPath(dataset) {
    return 'dfs.`' + path.normalize(__dirname + '/../../yelp_dataset_challenge_academic_dataset/') + 'yelp_academic_dataset_' + dataset + '.json`'
}

function doQuery(query, callback) {
    request.post(
        'http://localhost:8047/query.json', // Address of Apache Drill
        { 
            json: {
                'queryType': 'SQL',
                'query': query
            }
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                callback(body);
            }
        }
    );
}

module.exports = {
    hotspots: function(callback) {
        doQuery("select categories[0] as Categories_of_Restaurant_in_Phoenix, latitude, longitude from " + datasetPath('business') + " where city='Phoenix' and categories[0]='Fast Food'", function(firstAnswer) {
            var longitude = new Array();
            var latitude = new Array();
            var count = 0;
            for (var row of firstAnswer.rows) {
                count++;
                longitude[count] = row.longitude;
                latitude[count] = row.latitude;
                //console.log('Category: '+ row.Categories_of_Restaurant_in_Phoenix + 'Latitude: ' + row.latitude + " - longitude: " + row.longitude+" Addition: "+ (parseInt(longitude[count]) + parseInt(latitude[count])));
            }
            callback(get_hotspots(longitude,latitude));
        });
    }
};