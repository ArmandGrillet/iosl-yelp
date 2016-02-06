// Create a JSON file with center of the grid and distance to every features.

/*jslint node: true */
'use strict';

var fs = require('fs'); // We want to write a file thus we need fs.
var parserUtils = require('./parserUtils.js'); // Regular utils for parser.
var utils = require('../queries/utils'); // Regular utils for queries.

var city; // City where we have to proceed

// Processing the parameters.
process.argv.forEach(function(val, index, array) {
    switch (index) {
        case 2:
            if (val === 'LV') {
                city = 'Las Vegas';
            } else {
                city = utils.capitalizeFirstLetter(val);
            }
            break;
        default:
            break;
    }
});

if (city === undefined) { // One of the input is missing.
    console.log("Usage: node gridFeatures CITY. E.g. 'node gridFeatures City ' will create a newCity.geojson file");
} else { // We have all the parameters we need.
    fs.readFile(utils.featuresPath(city), 'utf8', function(err, data) { // Getting all the features
        if (err) {
            return console.log(err);
        }
        var features = JSON.parse(data); // Parsing the fatures to manipulate them.

        // We get the grid.
        utils.getGrid(city, function(grid) {
            var json = {
                "type": "FeatureCollection",
                "features": []
            };
            var i, j;
            var tile, center;
            for (i = 0; i < grid.features.length; i++) { // Do not confond grid.features and regular features.
                tile = grid.features[i];
                center = utils.getCenterTile(tile.geometry.coordinates);
                // We add the features in a radius of 100/250/500m as well as the nearest feature in each category.
                for (j = 0; j < features.types.length; j++) {
                    tile.properties[features.types[j]] = {
                        radius: {}
                    };
                    tile.properties[features.types[j]].nearest = Math.round(parserUtils.getDistanceToNearestElement(center, features[features.types[j]]) * 1000);
                    tile.properties[features.types[j]].radius['100'] = parserUtils.getNumberOfFeaturesforRadius(center, 100, features[features.types[j]]);
                    tile.properties[features.types[j]].radius['250'] = parserUtils.getNumberOfFeaturesforRadius(center, 250, features[features.types[j]]);
                    tile.properties[features.types[j]].radius['500'] = parserUtils.getNumberOfFeaturesforRadius(center, 500, features[features.types[j]]);
                }
                json.features.push(tile); // Update the tile.
            }
            // Write the tile.
            fs.writeFileSync('../static/grid/new' + city + '.geojson', JSON.stringify(json));
        });
    });
}
