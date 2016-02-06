/* Find the nearest feature in each category for each business */

/*jslint node: true */
'use strict';

var fs = require('fs'); // We want to write a file thus we need fs.
var json2csv = require('json2csv'); // Export a JSON into a CSV.
var parserUtils = require('./parserUtils.js'); // Regular utils for parser.
var utils = require('../queries/utils'); // Regular utils for queries.

var inputFile; // Name of the ouput file (without file extension)
var city; // Name of the city where we have to proceed
var category; // Category of businesses observed

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
        default:
            break;
    }
});

if (inputFile === undefined || city === undefined || category === undefined) { // One of the input is missing.
    console.log('Usage: node nearestFeatures INPUTFILE CITY BUSINESS. E.g. \'node nearestFeatures ./features-city.json City Bars\' will create a City-Bars.csv file');
} else {
    fs.readFile(inputFile, 'utf8', function(err, data) { // Getting all the features
        if (err) {
            return console.log(err);
        }
        var source = JSON.parse(data); // Parsing the fatures to manipulate them.
        parserUtils.isDrillRunning(function(running) {
            if (running === false) {
                console.log('Start Apache Drill before running this algorithm');
            } else {
                parserUtils.getBusinesses(city, category, function(businesses) { // We obtain the businesses
                    businesses = parserUtils.addSuccess(businesses);
                    /*
                    The 'fields' variable corresponds to the columns of the .csv file
                    We have :
                    - One column for the business' name
                    - One column for its success
                    - Many columns corresponding to the minimal distance to a specific feature (name of the column = name of the feature)
                    */
                    var fields = ['name', 'success'].concat(source.types); // The two first colmuns: name of the business and its success
                    var rows = []; // Array containing the JSON rows, a JSON row correspond to a business

                    var row = {}; // We use this JSON file to store one row before pushing it to the array.
                    for (var i = 0; i < businesses.length; i++) {
                        row = {
                            'name': businesses[i].name,
                            'success': businesses[i].success
                        };
                        for (var j = 0; j < source.types.length; j++) { // We calculate the minimal distance to each feature.
                            row[source.types[j]] = Math.round(parserUtils.getDistanceToNearestElement(businesses[i], source[source.types[j]]) * 1000);
                        }
                        rows.push(row); // We push the business to the array containing all of them.
                    }

                    json2csv({ // We use the json2csv module to transform our json objects into a .csv file.
                        data: rows,
                        fields: fields
                    }, function(err, csv) {
                        if (err) {
                            console.log(err);
                        }
                        // We write the file in the same directory as the parser, using the name given by the user as an input.
                        fs.writeFile('./' + city + '-' + category + '.csv', csv, function(err) {
                            if (err)
                                throw err;
                            console.log('File saved: ' + __dirname + '/' + city + '-' + category + '.csv');
                        });
                    });
                });
            }
        });
    });
}
