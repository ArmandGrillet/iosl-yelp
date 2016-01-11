/*jslint node: true */
'use strict';

var fs = require('fs');
var json2csv = require('json2csv');
var parserUtils = require('./parserUtils.js');
var utils = require('../queries/utils');

var city; // Name of the city where we have to proceed
var category; // Category of businesses observed
var outputFile; // Name of the ouput file (without file extension)

// Processing the parameters.
process.argv.forEach(function(val, index, array) {
    switch (index) {
        case 2:
            city = utils.capitalizeFirstLetter(val);
            break;
        case 3:
            category = utils.capitalizeFirstLetter(val);
            break;
        case 4:
            outputFile = val;
            break;
        default:
            break;
    }
});

if (city === undefined || category === undefined || outputFile === undefined) { // One of the input is missing.
    console.log("Usage: node nearestFeatures CITY BUSINESS OUTPUTFILE. E.g. 'node nearestFeatures City Bars cityBars' will create a cityBars.csv file");
} else {
    fs.readFile(utils.featuresPath(city), 'utf8', function(err, data) { // Getting all the features
        if (err) {
            return console.log(err);
        }
        var source = JSON.parse(data); // Parsing the fatures to manipulate them.
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
                    "name": businesses[i].name,
                    "success": businesses[i].success
                };
                for (var j = 2; j < fields.length; j++) { // We calculate the minimal distance to each feature.
                    row[fields[j]] = Math.round(parserUtils.getDistanceToNearestElement(businesses[i], source[fields[j]]) * 1000);
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
                fs.writeFile("./" + outputFile + '.csv', csv, function(err) {
                    if (err)
                        throw err;
                    console.log(outputFile + ' saved.');
                });
            });
        });
    });
}
