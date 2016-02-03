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
    map = L.map('prod-map').setView([cities.Edinburgh.latitude, cities.Edinburgh.longitude], 15); // Sets the view to be in Edinburgh with a zoom level of 15.
    UILayer = new L.LayerGroup().addTo(map); // Adds the layer to the map object.
    
    // Downloads the map layer's data.
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 10,
        maxZoom: 18,
        attribution: '© <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // When the user selects a new city we move the map's center to the city selected using moveTo().
    $("#cities").change(function() {
        moveTo($(this).children(":selected").val());
        request($(this).children(":selected").val(), $("#categories").children(":selected").val());
    });
    
    $("#categories").change(function() {
        request($("#cities").children(":selected").val(), $(this).children(":selected").val());
    });
    
    $("input[name='algorithm']").change(function() {
        request($("#cities").children(":selected").val(), $("#categories").children(":selected").val());
    });
    
    // We're doing a first request
    request($("#cities").children(":selected").val(), $("#categories").children(":selected").val());
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
                        // marker.on('click', markerClick);
                    }
                    if (markerParameters.options.icon !== undefined) {
                        marker.setIcon(L.icon({
                            iconUrl: '../markers/' + markerParameters.options.icon + '.png',
                            iconRetinaUrl: '../markers/' + markerParameters.options.icon + '@2x.png',
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                        }));
                    }
                }
                marker.addTo(UILayer);
            }
        }
        
        if (data.circles !== undefined) { // There are circles, we display them using the LeafLet API.
            var circles = data.circles;
            for (i = 0; i < circles.length; i++) {
                var circleParameters = circles[i];
                position = {
                    latitude: circleParameters.latitude,
                    longitude: circleParameters.longitude
                };
                delete circleParameters.latitude;
                delete circleParameters.latitude;
                
                var radius = circleParameters.radius;
                delete circleParameters.radius;
                
                if (circleParameters.popup !== '') {
                    popup = circleParameters.popup;
                    delete circleParameters.popup;
                    var circle = L.circle([position.latitude, position.longitude], radius, circleParameters.options).addTo(UILayer);
                    circle.bindPopup(popup);
                } else {
                    L.marker([position.latitude, position.longitude], radius, circleParameters.options).addTo(UILayer);
                }
            }
        }
        
        if (data.polygons !== undefined) { // There are polygons, we display them using the LeafLet API.
            var polygons = data.polygons;
            for (i = 0; i < polygons.length; i++) {
                var points = [];
                for (var j = 0; j < polygons[i].points.length; j++) {
                    points.push([parseFloat(polygons[i].points[j].latitude), parseFloat(polygons[i].points[j].longitude)]);
                }
                delete polygons[i].points;
                if (polygons[i].popup !== '') {
                    popup = polygons[i].popup;
                    delete polygons[i].popup;
                    var polygon = L.polygon(points, polygons[i].options).addTo(UILayer);
                    polygon.bindPopup(popup);
                } else {
                    L.polygon(points, polygons[i].options).addTo(UILayer);
                }
            }
        }
    }
}

function request(city, category) {
    var query = {
        'latitude': map.getCenter().lat,
        'longitude': map.getCenter().lng,
        'city': city,
        'category': category
    };
    
    if ($('#businesses-algorithm').is(':checked')) {
        query.algorithm = "businesses";
    } else {
        query.algorithm = "hotgrid";
    }
    
    $.get('/mapquery', query, function(data) {
        display(data);
    });
}

// Changes the mapt's center to be in the parameter city.
function moveTo(city) {
    if (cities[city] !== undefined) {
        map.panTo(new L.LatLng(cities[city].latitude, cities[city].longitude));
    } else {
        alert('The city selected is not in our database.');
    }
}
