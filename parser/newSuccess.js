/*jslint node: true */
'use strict';

var fs = require('fs');
var json2csv = require('json2csv');
var parserUtils = require('./parserUtils.js');
var utils = require('../queries/utils');

function newSuccess(businesses) {
    var averageCheckins = 0;
    var averageStars = 0;
    var averageReviews = 0;
    var businessesWithSuccess = [];
    var maxCheckins = 0,
        maxStars = 0,
        maxReviews = 0;

    // Calculating the mean of checkin, stars and review count of a business category
    for (var i = 0; i < businesses.length; i++) {
        averageCheckins += parseFloat(businesses[i].checkins);
        averageStars += parseFloat(businesses[i].stars);

        if (parseFloat(businesses[i].checkins) > parseFloat(maxCheckins)) {
            maxCheckins = parseFloat(businesses[i].checkins);
        }
        if (parseFloat(businesses[i].stars) > parseFloat(maxStars)) {
            maxStars = parseFloat(businesses[i].stars);
        }
        if (parseFloat(businesses[i].reviews) > maxReviews) {
            maxReviews = parseFloat(businesses[i].reviews);
        }
    }
    averageCheckins /= businesses.length;
    averageStars /= businesses.length;
    averageReviews /= businesses.length;

    var starsScore = {
        0: 0.5,
        1: 0.7,
        2: 0.9,
        3: 1,
        4: 0.8,
        5: 0.6
    };

    // Success = ponderation based on the stars * ((scorereviews + (scoreCheckins * 4)) / 5)
    for (i = 0; i < businesses.length; i++) {
        businessesWithSuccess.push({
            'name': businesses[i].name,
            'latitude': businesses[i].latitude,
            'longitude': businesses[i].longitude,
            'success': starsScore[Math.round(businesses[i].stars)] * ((parseFloat(businesses[i].reviews / maxReviews) + parseFloat(businesses[i].checkins / maxCheckins) * 4) / 5)
        });
    }

    // Putting the success between 0 and 1
    return businessesWithSuccess;
}

var city;
var category;
var outputFile;
var distance;

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
    console.log("Usage: node newSuccess CITY BUSINESS OUTPUTFILE DISTANCE. E.g. 'node newSuccess City Bars cityBars 100' will create a cityBars.csv file");
} else {
    fs.readFile(utils.featuresPath(city), 'utf8', function(err, data) {
        if (err) {
            return console.log(err);
        }
        var source = JSON.parse(data); // Parsing the JSON features
        parserUtils.getBusinesses(city, category, function(businesses) {
            businesses = newSuccess(businesses);
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
                    row[fields[j]] = parserUtils.getNumberOfFeaturesforRadius(fields[j], businesses[i], distance, source[fields[j]]);
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
