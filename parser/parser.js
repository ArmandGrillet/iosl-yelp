/* Parse the multiple JSON we have for each feature into one JSON */

/*jslint node: true */
'use strict';

var async = require('async'); // We need async to handle multiple files in parallel.
var fs = require('fs'); // We want to write a file thus we need fs.
var path = require('path'); // We manipulate the path of the files in this algorithm thus we need path.

// When a feature contains multiple nodes due to its size we're calculating its center so that we only have one set of coordinates for one feature.
function getCenter(nodes, list) {
    var nodesCoordinates = [];
    for (var i = 0; i < nodes.length; i++) {
        for (var j = 0; j < list.length; j++) {
            if (list[j].id === nodes[i]) {
                nodesCoordinates.push({
                    latitude: list[j].lat,
                    longitude: list[j].lon
                });
            }
        }
    }
    var center = {
        latitude: nodesCoordinates[0].latitude,
        longitude: nodesCoordinates[0].longitude
    };

    for (i = 1; i < nodesCoordinates.length; i++) {
        center.latitude = (center.latitude * i + nodesCoordinates[i].latitude) / (i + 1);
        center.longitude = (center.longitude * i + nodesCoordinates[i].longitude) / (i + 1);
    }

    return center;
}

var inputDir;
var outputFile;

// Processing the parameters.
process.argv.forEach(function(val, index, array) {
    if (index === 2) {
        inputDir = val;
        if (inputDir.slice(-1) !== '/') {
            inputDir += '/'; // Needs to be a directory.
        }
    } else if (index == 3) {
        outputFile = val;
    }
});

if (inputDir === undefined || outputFile === undefined) {
    console.log("Usage: node parser INPUTDIRECTORY OUTPUTFILE. E.g. 'node parser path/to/city/ city' will create a city.json");
} else { // All the parameters are here, we can parse the input directory to create the JSON.
    var obj;
    var allFeaturesJSON = {
        types: []
    };

    fs.readdir(inputDir, function(err, files) { // Read the directory and get all the files in it.
        if (err) {
            throw err;
        }
        async.each(files, function(file, callback) { // Async each handles all the files in parallel.
            if (path.extname(file) == '.json') { // We're only parsing JSON files.
                fs.readFile(inputDir + file, 'utf8', function(err, data) {
                    if (err) {
                        throw err;
                    }
                    // Getting the name of the feature from its filename.
                    var name = file.substring(file.indexOf('_') + 1);
                    name = name.replace(/_[A-Za-z0-9_]+.json/, '');

                    obj = JSON.parse(data); // Parsing the JSON
                    for (var i = 0; i < obj.elements.length; i++) { // Analyzing each element in it.
                        if (i === 0) { // First element analyzed in this JSON, we're adding the feature and creating an array to store the coordinates for this feature.
                            allFeaturesJSON.types.push(name);
                            allFeaturesJSON[name] = [];
                        }

                        if (obj.elements[i].tags !== undefined) { // A real feature
                            if (obj.elements[i].type == 'node') { // Simple coordinates, just a node
                                allFeaturesJSON[name].push({
                                    latitude: obj.elements[i].lat,
                                    longitude: obj.elements[i].lon
                                });
                            } else if (obj.elements[i].type === 'way') { // Multiple coordinates, we need to compute the center
                                allFeaturesJSON[name].push(getCenter(obj.elements[i].nodes, obj.elements));
                            } else if (obj.elements[i].type === 'relation') { // Add tags to the ways of the relation so that we'll add them later in the loop.
                                for (var j = 0; j < obj.elements[i].members.length; j++) {
                                    for (var k = 0; k < obj.elements.length; k++) {
                                        if (obj.elements[k].id === obj.elements[i].members[j].ref) {
                                            obj.elements[k].tags = obj.elements[i].tags;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    callback();
                });
            } else {
                callback();
            }
        }, function(err) {
            if (err) {
                console.log(err);
            } else { // All the files have been processed without error, we can write the output file.
                fs.writeFile("./" + outputFile + ".json", JSON.stringify(allFeaturesJSON), function(err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log(outputFile + " has been saved.");
                });
            }
        });
    });
}
