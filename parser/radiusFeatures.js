/*jslint node: true */
'use strict';

var fs = require('fs');
var json2csv = require('json2csv');
var parserUtils = require('./parserUtils.js');
var utils = require('../queries/utils');

var city;
var category;
var outputFile;
var distance;

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
        case 5:
            distance = parseInt(val);
            break;
        default:
            break;
    }
});

if (city === undefined || category === undefined || outputFile === undefined || isNaN(distance)) {
    console.log("Usage: node nearestFeatures CITY BUSINESS OUTPUTFILE DISTANCE. E.g. 'node radiusFeatures City Bars cityBars 100' will create a cityBars.csv file");
} else {
    fs.readFile(utils.featuresPath(city), 'utf8', function(err, data) {
        if (err) {
            return console.log(err);
        }
        var source = JSON.parse(data); // Parsing the JSON features
        parserUtils.getBusinesses(city, category, function(businesses) {
            businesses = parserUtils.addSuccess(businesses);
            var fields = ['name', 'success'].concat(source.types);
            var rows = [];

            var row;
            var type;
            for (var i = 0; i < businesses.length; i++) {
                row = {
                    "name": businesses[i].name,
                    "success": businesses[i].success
                };
                for (var j = 2; j < fields.length; j++) {
                    row[fields[j]] = parserUtils.getNumberOfFeaturesforRadius(businesses[i], distance, source[fields[j]]);
                }
                rows.push(row);
            }

            json2csv({
                data: rows,
                fields: fields
            }, function(err, csv) {
                if (err) console.log(err);
                fs.writeFile("./" + outputFile + '.csv', csv, function(err) {
                    if (err)
                        throw err;
                    console.log(outputFile + ' saved.');
                });
            });
        });
    });
}
