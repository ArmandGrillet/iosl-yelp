/*jslint node: true */
'use strict';

var fs = require('fs');
var json2csv = require('json2csv');
var utils = require('../queries/utils');

/*
Function to get the number of checkins per week for a business.
    id = id of the business
    data = all the checkins given by Apache Drill
*/
function checkinfsForId(id, data) {
    for (var i = 0; i < data.rows.length; i++) {
        if (id == data.rows[i].business_id) {
            var checkins = 0;
            var unformattedCheckins = JSON.parse(data.rows[i].checkin_info);
            for (var key in unformattedCheckins) {
                checkins += unformattedCheckins[key];
            }
            return checkins;
        }
    }
    return 0;
}

/*
Asynchronous function to get all the business in a specified category in a city.
We process the businesses to have a nice JSON containing all the information we need (including the number of checkins of a business).
Parameters:
    city = name of the city where we want to find the businesses
    category = category of the businesses searched
    callback = what to do once we have processed the businesses, we give the processed results to this function
*/
function getBusinesses(city, category, callback) {
    /*
    We use Apache Drill to query the dataset, we use it two times to get:
        - All the checkins
        - All the businesses in the city in a specific category.
    */
    utils.askDrill("SELECT table_business.business_id, table_checkin.checkin_info from " + utils.datasetPath('checkin') + " AS table_checkin INNER JOIN " + utils.datasetPath('business') + " AS table_business ON table_checkin.business_id = table_business.business_id WHERE table_business.city = '" + city + "' AND true=repeated_contains(table_business.categories,'" + category + "')", function(checkins) {
        utils.askDrill("select business_id, name, total_checkins, stars, review_count, latitude, longitude from " + utils.datasetPath('business') + " WHERE city='" + city + "' AND true=repeated_contains(categories,'" + category + "')", function(rawBusinesses) {
            var businesses = [];
            for (var i = 0; i < rawBusinesses.rows.length; i++) {
                businesses.push({
                    'id': rawBusinesses.rows[i].business_id,
                    'name': rawBusinesses.rows[i].name,
                    'latitude': rawBusinesses.rows[i].latitude,
                    'longitude': rawBusinesses.rows[i].longitude,
                    'stars': rawBusinesses.rows[i].stars,
                    'reviews': rawBusinesses.rows[i].review_count,
                    'checkins': checkinfsForId(rawBusinesses.rows[i].business_id, checkins)
                });
            }
            callback(addSuccess(businesses));
        });
    });
}

/*
Function to get the nearest element on a list to a business.
Parameters:
    - business: JSON containing a latitude and longitude.
    - list: array of JSON objects having a lat and lon attributes.
*/

function getDistanceToNearestElement(business, list) {
    var nearestElement = {};
    var distanceToElement;
    var nearestDistance;
    if (list.length > 0) {
        nearestDistance = utils.distance(list[0].lat, list[0].lon, business.latitude, business.longitude);
    } else {
        return {};
    }
    for (var i = 0; i < list.length; i++) {
        distanceToElement = utils.distance(list[i].lat, list[i].lon, business.latitude, business.longitude);
        if (distanceToElement <= nearestDistance) {
            nearestDistance = distanceToElement;
            nearestElement = list[i];
        }
    }
    return nearestDistance;
}

function addSuccess(businesses) {
    var averageCheckins = 0,
        averageStars = 0,
        averageReviews = 0;
    var maxCheckins = 0,
        maxStars = 0,
        maxReviews = 0;
    var businessesWithSuccess = [];


    // Calculating the mean of checkins, stars and review counts of the businesses.
    for (var i = 0; i < businesses.length; i++) {
        averageCheckins += parseFloat(businesses[i].checkins);
        averageStars += parseFloat(businesses[i].stars);
        averageReviews += parseFloat(businesses[i].reviews);
    }

    averageCheckins /= businesses.length;
    averageStars /= businesses.length;
    averageReviews /= businesses.length;

    // Normalizing the values
    for (i = 0; i < businesses.length; i++) {
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

    for (i = 0; i < businesses.length; i++) {
        businessesWithSuccess.push({
            'name': businesses[i].name,
            'latitude': businesses[i].latitude,
            'longitude': businesses[i].longitude,
            'success': ((parseFloat(businesses[i].checkins / maxCheckins) + parseFloat(businesses[i].stars / maxStars) + parseFloat(businesses[i].reviews / maxReviews)) / 3)
        });
    }
    return businessesWithSuccess;
}

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
    console.log("Usage: node nearestFeatures FEATURESPATH CITY BUSINESS OUTPUTFILE. E.g. 'node nearestFeatures City Bars cityBars' will create a cityBars.csv file");
} else {
    fs.readFile(utils.featuresPath(city), 'utf8', function(err, data) { // Getting all the features
        if (err) {
            return console.log(err);
        }
        var source = JSON.parse(data); // Parsing the fatures to manipulate them.
        getBusinesses(city, category, function(businesses) { // We obtain the businesses
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
                    row[fields[j]] = Math.round(getDistanceToNearestElement(businesses[i], source[fields[j]]) * 1000);
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
