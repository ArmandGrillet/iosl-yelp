/* Counts the number of features in a selected radius around each businesses in a category */

/*jslint node: true */
'use strict';

var fs = require('fs'); // We want to write a file thus we need fs.
var json2csv = require('json2csv'); // Export a JSON into a CSV.
var parserUtils = require('./parserUtils.js'); // Regular utils for parser.
var utils = require('../queries/utils'); // Regular utils for queries.

// Inputs from the user
var inputFile; // Name of the ouput file (without file extension)
var city; // Name of the city where we have to proceed
var category; // Category of businesses observed
var radius; // Radius given by the users

// Processing the parameters.
process.argv.forEach(function(val, index, array) {
    switch (index) {
        case 2:
            inputFile = val;
            break;
        case 3:
            if (val === 'LV') {
                city = 'Las Vegas';
            } else {
                city = utils.capitalizeFirstLetter(val);
            }
            break;
        case 4:
            category = utils.capitalizeFirstLetter(val);
            break;
        case 5:
            radius = parseInt(val);
            break;
        default:
            break;
    }
});

// Check that all the parameters are here.
if (inputFile === undefined || city === undefined || category === undefined || isNaN(radius)) {
    console.log('Usage: node radiusFeatures INPUTFILE CITY CATEGORY RADIUS. E.g. \'node radiusFeatures ./features-city.json City Bars 100\' will create a cityBars100.csv file');
} else {
    fs.readFile(inputFile, 'utf8', function(err, data) { // Getting all the features
        if (err) {
            return console.log(err);
        }
        var source = JSON.parse(data); // Parsing the JSON features
        parserUtils.isDrillRunning(function(running) {
            if (running === false) {
                console.log('Start Apache Drill before running this algorithm');
            } else {
                parserUtils.getBusinesses(city, category, function(businesses) {
                    businesses = parserUtils.addSuccess(businesses);
                    var fields = ['name', 'success', 'same businesses in radius'].concat(source.types);
                    var rows = [];
                    var row;
                    var type;
                    var distance;
                    var i, j;
                    for (i = 0; i < businesses.length; i++) {
                        row = {
                            'name': businesses[i].name,
                            'success': businesses[i].success,
                            'same businesses in radius': 0
                        };
                        // Counts the number of businesses in the same category in the specified radius.
                        for (j = 0; j < businesses.length; j++) {
                            if (i != j) {
                                distance = 1000 * utils.distance(businesses[i].latitude, businesses[i].longitude, businesses[j].latitude, businesses[j].longitude);
                                if (distance <= radius) {
                                    row['same businesses in radius']++;
                                }
                            }
                        }

                        for (j = 0; j < source.types.length; j++) {
                            row[source.types[j]] = parserUtils.getNumberOfFeaturesforRadius(businesses[i], radius, source[source.types[j]]);
                        }
                        rows.push(row);
                    }

                    // Transform the JSON into an Excel file.
                    json2csv({
                        data: rows,
                        fields: fields
                    }, function(err, csv) {
                        if (err) console.log(err);
                        fs.writeFile('./' + city + '-' + category + '-' + radius + '.csv', csv, function(err) {
                            if (err)
                                throw err;
                            console.log('File saved: ' + __dirname + '/' + city + '-' + category + '-' + radius + '.csv');
                        });
                    });
                });
            }
        });
    });
}
