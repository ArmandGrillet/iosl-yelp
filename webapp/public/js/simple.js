'use strict';

var map;
var markers;

window.onload = function() {
    map = L.map('map').setView([33.4483800, -112.0740400], 15);
    markers = new L.FeatureGroup().addTo(map);

	// Downloading the map layer
	L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		minZoom: 10, 
		maxZoom: 18, 
		attribution: '© <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
	}).addTo(map);

    $('#city, #business').on('change', getMapData);
    $('#hotspots').on('click', getHotspots);
}

function getMapData() {
    $.get('/businesses', { city: $('#city').val(), business: $('#business').val() }, function(businesses) {
        markers.clearLayers();
        for (var business of businesses.rows) {
            markers.addLayer(L.marker([business.latitude, business.longitude]).bindPopup(business.name));
        }
    });
}

function getHotspots() {
    $.get('/hotspots', function(hotspots) {
        markers.clearLayers();
        for (var hotspot of hotspots) {
            console.log(hotspot.latitude);
            markers.addLayer(L.marker([hotspot.latitude, hotspot.longitude]).bindPopup('Hotspot'));
        }
    });
}