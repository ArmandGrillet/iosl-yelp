var map; // Will be use to be the LeafLet map.
var UILayer; // The layer on the map containing all the markers/circles/tiles we're displaying.
var cities = { // Cities we show in the webapp with their coordinates.
    'Pittsburgh': {
        latitude: 40.440625,
        longitude: -79.995886
    },
    'Charlotte': {
        latitude: 35.227087,
        longitude: -80.843127
    },
    'Champaign': {
        latitude: 40.11642,
        longitude: -88.24338
    },
    'Phoenix': {
        latitude: 33.448377,
        longitude: -112.074037
    },
    'Las Vegas': {
        latitude: 36.169941,
        longitude: -115.139830
    },
    'Madison': {
        latitude: 43.073052,
        longitude: -89.401230
    },
    'Montreal': {
        latitude: 45.501689,
        longitude: -73.567256
    },
    'Waterloo': {
        latitude: 43.4668000,
        longitude: -80.5163900
    },
    'Karlsruhe': {
        latitude: 49.006890,
        longitude: 8.403653
    },
    'Edinburgh': {
        latitude: 55.953252,
        longitude: -3.188267
    },
};

// Once the .html page is loaded, we execute this code.
window.onload = function() {
    map = L.map('map').setView([cities.Edinburgh.latitude, cities.Edinburgh.longitude], 15); // Sets the view to be in Edinburgh with a zoom level of 15.
    UILayer = new L.LayerGroup().addTo(map); // Adds the layer to the map object.

    // Downloads the map layer's data.
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 10,
        maxZoom: 18,
        attribution: '© <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map);

    $('#clear').on('click', clearUILayer); // Clear the UI layer on the map by using the function.

    // When a user clicks on "Run"
    $('#run-request').on('click', function() {
        var request = $('#request').val(); // Get the request
        var query = {}; // The query will be the object sent to the server, it needs some info.
        // Give the latitude and longitude of the query by getting the center of the map displayed.
        query.latitude = map.getCenter().lat;
        query.longitude = map.getCenter().lng;

        // Get the city displayed on the map.
        query.city = getNearestCity(query.latitude, query.longitude);

        // The request has some parameters.
        if (request.indexOf('?') > -1) {
            // Set the algorithm valuer, it is the string before the '?'
            query.algorithm = request.substr(0, request.indexOf('?'));

            // Get all the parameters of the request.
            var parameters = request.substring(request.indexOf('?') + 1).split('&');
            for (var i = 0; i < parameters.length; i++) {
                var parameter = parameters[i].split('=');
                query[parameter[0]] = parameter[1]; // Create a JSON value on the fly.
            }
        } else { // The request doesn't have parameters, the algorithm is simply the input.
            query.algorithm = request;
        }


        if (query.algorithm === undefined) { // Syntax error, alert the user.
            alert('The format of your query is not correct.');
        } else { // Everything looks fine, we send the query to the server, check app.js for the routing.
            $.get('/query', query, function(data) {
                display(data);
            });
        }
    });

    // When the user selects a new city we move the map's center to the city selected using moveTo().
    $("#cities").change(function() {
        moveTo($(this).children(":selected").val());
    });
};

// Clear the UI layer, we do not use UILayer.clearLayers() so that we can use the function directly as a callback, e.g. $('#clear').on('click', clearUILayer);
function clearUILayer() {
    UILayer.clearLayers();
}

// Display the data returned by the queries.
function display(data) {
    if (data.error !== undefined) { // There is an error, we show it.
        alert(data.error);
    } else { // Only data, we display it on the map.
        clearUILayer(); // We clean the map first so that the previous data displayed isn't here anymore.
        var position, popup; // Position and popup of an element.
        var i; // Loop to go through the elements.
        if (data.position !== undefined) { // Do we have to move on a particular location?
            map.panTo(new L.LatLng(data.position.latitude, data.position.longitude));
            if (data.position.zoom !== undefined) { // Do we have to set a particular level of zoom?
                map.setZoom(data.position.zoom);
            }
        }
        if (data.markers !== undefined) { // There are markers, we display them using the LeafLet API.
            var markers = data.markers;
            var markerParameters;
            for (i = 0; i < markers.length; i++) {
                markerParameters = markers[i];

                position = {
                    latitude: markerParameters.latitude,
                    longitude: markerParameters.longitude
                };
                delete markerParameters.latitude;
                delete markerParameters.longitude;

                marker = L.marker([position.latitude, position.longitude], markerParameters.options);
                if (markerParameters.popup !== undefined) {
                    marker.bindPopup(markerParameters.popup);
                }
                if (markerParameters.options !== undefined) {
                    if (markerParameters.options.onclick === true) { // This option is not part of the API, if the value onclick is set to true we will fire an event when the user clicks on the marker using markerClick().
                        marker.on('click', markerClick);
                    }
                }
                marker.addTo(UILayer);
            }
        }

        if (data.circles !== undefined) { // There are circles, we display them using the LeafLet API.
            var circles = data.circles;
            var radius;
            var circle;
            for (i = 0; i < circles.length; i++) {
                var circleParameters = circles[i];
                position = {
                    latitude: circleParameters.latitude,
                    longitude: circleParameters.longitude
                };
                delete circleParameters.latitude;
                delete circleParameters.latitude;

                radius = circleParameters.radius;
                delete circleParameters.radius;

                if (circleParameters.popup !== '') {
                    popup = circleParameters.popup;
                    delete circleParameters.popup;
                    circle = L.circle([position.latitude, position.longitude], radius, circleParameters.options).addTo(UILayer);
                    circle.bindPopup(popup);
                } else {
                    L.marker([position.latitude, position.longitude], radius, circleParameters.options).addTo(UILayer);
                }
            }
        }

        if (data.polygons !== undefined) { // There are polygons, we display them using the LeafLet API.
            var polygons = data.polygons;
            var polygon;
            var points = [];
            for (i = 0; i < polygons.length; i++) {
                points = [];
                for (var j = 0; j < polygons[i].points.length; j++) {
                    points.push([parseFloat(polygons[i].points[j].latitude), parseFloat(polygons[i].points[j].longitude)]);
                }
                delete polygons[i].points;
                if (polygons[i].popup !== '') {
                    popup = polygons[i].popup;
                    delete polygons[i].popup;
                    polygon = L.polygon(points, polygons[i].options).addTo(UILayer);
                    polygon.bindPopup(popup);
                } else {
                    L.polygon(points, polygons[i].options).addTo(UILayer);
                }
            }
        }
    }
}

// Calculate the distance between two positions.
function distance(lat1, lon1, lat2, lon2) {
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
    return dist;
}

// Get the nearest city in cities using the coordinates of the center of the map and the function distance().
function getNearestCity(latitude, longitude) {
    var nearestCity, smallestDistance;
    for (var city in cities) {
        var distanceForCity = distance(latitude, longitude, cities[city].latitude, cities[city].longitude);
        if (smallestDistance === undefined || smallestDistance > distanceForCity) {
            nearestCity = city;
            smallestDistance = distanceForCity;
        }
    }
    return nearestCity;
}

// Event hander if there is a click on a marker that has a "onclick" event.
function markerClick(e) {
    if (this.options.alt !== undefined) {
        // We create a small query to use the info algorithm.
        var query = {};
        query.algorithm = 'info';
        query.business_id = this.options.alt; // We're using the alt option to get the business id.

        $.get('/query', query, function(data) {
            $('#marker-info').text(JSON.stringify(data)); // Display what is returned by info.
        });
    }
}

// Changes the mapt's center to be in the parameter city.
function moveTo(city) {
    if (cities[city] !== undefined) {
        map.panTo(new L.LatLng(cities[city].latitude, cities[city].longitude));
    } else {
        alert('The city selected is not in our database.');
    }
}
