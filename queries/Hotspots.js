var request = require('request');
var path = require('path');
var longitude = new Array();
var latitude = new Array();
var count = 0;

function datasetPath(dataset) {
    return 'dfs.`' + path.normalize(__dirname + '/../../yelp_dataset_challenge_academic_dataset/') + 'yelp_academic_dataset_' + dataset + '.json`'
}

function distance(lat1, lon1, lat2, lon2, unit) {		//function to calculate the distance between two coordinates
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
	if (unit=="K") { dist = dist * 1.609344 }
	if (unit=="N") { dist = dist * 0.8684 }
	return dist
	}
	
	function UniqueArray(hotspot_array) {			//Function to make the array with unique values
    var present_array = {};
    for (var i = 0; i < hotspot_array.length; i++)
        present_array[hotspot_array[i]] = true;
    var new_array = [];
    for (var k in present_array)
        new_array.push(k);
    return new_array;
	}

function display_hotspots(longitude, latitude)
	{
		var relative_distance;				//Relative distance from other Restaurants
		var hotspots_latitude = new Array();	//Hotspot latitude Array
		var hotspots_longitude = new Array();	//Hotspot longitude Array
		var hotspot_count=0;					//Hotspot count to count the number of shops around for which we have chosen 5, so if cluster has more than 5 shops it's an Hotspot region
		for (var i=1;i<longitude.length;i++)	//loop to iterate through the list of latitudes and longitudes and calculate distance between them 
		{
			hotspot_count=0
			for(var j=1; j<longitude.length;j++){
			relative_distance =  distance(latitude[i], longitude[i], latitude[j], longitude[j], "K"); // calculating distance in KMs between two points on map
			if(relative_distance<3 && relative_distance>0){					//We have taken distance 3KM if the shops are neighbouring
				hotspot_count=hotspot_count+1;								
				}
			if(hotspot_count==5){					//capturing the coordinates when it is considered a hotspot cluster, '=' because we just want to add once
				hotspots_latitude.push(latitude[j]);
				hotspots_longitude.push(longitude[j]);
				}
			}										
			if(hotspot_count>4){					//capturing the coordinates of base shop from where we were calculating distances from other shops
						hotspots_latitude.push(latitude[i]);
						hotspots_longitude.push(longitude[i]);
						console.log("Found the cluster with shops "+ hotspot_count);
				}
		}
		//To make the list of coordinates to be unique
		hotspots_latitude = UniqueArray(hotspots_latitude);
		hotspots_longitude = UniqueArray(hotspots_longitude);
		
		for (var k=1; k< hotspots_latitude.length; k++)
		{
			console.log("latitude and longitudes which are close to each other "+hotspots_latitude[k]+" - " + hotspots_longitude[k] );
			
		}
	}
function doQuery(query, callback) {
    resp = {}
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

// Your code
doQuery("select categories[0] as Categories_of_Restaurant_in_Phoenix, latitude, longitude from " + datasetPath('business') + " where city='Phoenix' and categories[0]='Fast Food'", function(firstAnswer) {
    console.log("Coordinates of FastFood in Phoenix:");
    for (var row of firstAnswer.rows) {
		count=count+1;
		longitude[count] = row.latitude;
		latitude[count] = row.longitude;
		//console.log('Category: '+ row.Categories_of_Restaurant_in_Phoenix + 'Latitude: ' + row.latitude + " - longitude: " + row.longitude+" Addition: "+ (parseInt(longitude[count]) + parseInt(latitude[count])));
    }display_hotspots(longitude,latitude);
});