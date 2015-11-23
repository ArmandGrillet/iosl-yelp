var map;
var markersLayer;
var cities = {
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

window.onload = function() {
    map = L.map('map').setView([cities.Edinburgh.latitude, cities.Edinburgh.longitude], 15);
    markersLayer = new L.LayerGroup().addTo(map);

    // Downloading the map layer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 10,
        maxZoom: 18,
        attribution: '© <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map);

    $('#clean').on('click', clearLayers);

    $('#run-request').on('click', function() {
        var request = $('#request').val();
        var query = {};
        query.latitude = map.getCenter().lat;
        query.longitude = map.getCenter().lng;

        query.city = getNearestCity(query.latitude, query.longitude);
        if (request.indexOf('?') > -1) {
            query.algorithm = request.substr(0, request.indexOf('?'));

            var otherParameters = request.substring(request.indexOf('?') + 1).split('&');
            for (var i = 0; i < otherParameters.length; i++) {
                var parameter = otherParameters[i].split('=');
                query[parameter[0]] = parameter[1];
            }
        } else {
            query.algorithm = request;
        }

        if (query.algorithm === undefined) {
            console.log('Query is not correct');
        } else {
            get(query);
        }
    });

    $(".select").change(function() {
        moveTo($(this).children(":selected").val());
    });
};

function clearLayers() {
    markersLayer.clearLayers();
}

function display(data) {
    if (data.error !== undefined) {
        console.log(data.error);
    } else {
        markersLayer.clearLayers(); // We clean the map
        var position, popup, onclick; // Position and popup of an element.
        var i; // Loop to go through the elements.
        if (data.position !== undefined) {
            console.log(data.position);
            map.panTo(new L.LatLng(data.position.latitude, data.position.longitude));
            if (data.position.zoom !== undefined) {
                map.setZoom(data.position.zoom);
            }
        }
        if (data.markers !== undefined) {
            var markers = data.markers;
            var marker;
            for (i = 0; i < markers.length; i++) {
                var markerParameters = markers[i];
                position = {
                    latitude: markerParameters.latitude,
                    longitude: markerParameters.longitude
                };
                delete markerParameters.latitude;
                delete markerParameters.longitude;

                marker = L.marker([position.latitude, position.longitude], markerParameters.options);
                if (markerParameters.popup !== undefined) {
                    popup = markerParameters.popup;
                    delete markerParameters.popup;
                    marker.bindPopup(popup);
                }
                if (markerParameters.onclick !== undefined) {
                    onclick = markerParameters.onclick;
                    delete markerParameters.onclick;
                    marker.on('click', markerClick);
                }
                marker.addTo(markersLayer);
            }
        }

        if (data.circles !== undefined) {
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
                    var circle = L.circle([position.latitude, position.longitude], radius, circleParameters.options).addTo(markersLayer);
                    circle.bindPopup(popup);
                } else {
                    L.marker([position.latitude, position.longitude], radius, circleParameters.options).addTo(markersLayer);
                }
            }
        }

        if (data.polygons !== undefined) {
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
                    var polygon = L.polygon(points, polygons[i].options).addTo(markersLayer);
                    polygon.bindPopup(popup);
                } else {
                    L.polygon(points, polygons[i].options).addTo(markersLayer);
                }
            }
        }
    }
}

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

function get(query) {
    $.get('/mapquery', query, function(data) {
        display(data);
    });
}

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

function markerClick(e) {
    console.log(this);
    if (this.options.alt !== undefined) {
        var query = {};
        query.latitude = map.getCenter().lat;
        query.longitude = map.getCenter().lng;

        query.city = getNearestCity(query.latitude, query.longitude);
        query.algorithm = 'info';
        query.business_id = this.options.alt;

        $.get('/infoquery', query, function(data) {
            console.log(data);
            $('#marker-info').text(data.name + ": " + data.full_address);
        });
    }
}

function moveTo(city) {
    if (cities[city] !== undefined) {
        map.panTo(new L.LatLng(cities[city].latitude, cities[city].longitude));
    } else {
        console.log('City is not in the Yelp dataset');
    }
}
