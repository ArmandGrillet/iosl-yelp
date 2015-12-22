/*jslint node: true */

'use strict';

var async = require('async');
var fs = require('fs');
var path = require('path');

function getCenter(nodes, list) {
    var nodesCoordinates = [];
    for (var i = 0; i < nodes.length; i++) {
        for (var j = 0; j < list.length; j++) {
            if (list[j].id === nodes[i]) {
                nodesCoordinates.push({
                    lat: list[j].lat,
                    lon: list[j].lon
                });
            }
        }
    }
    var center = {
        lat: nodesCoordinates[0].lat,
        lon: nodesCoordinates[0].lon
    };

    for (i = 1; i < nodesCoordinates.length; i++) {
        center.lat = (center.lat * i + nodesCoordinates[i].lat) / (i + 1);
        center.lon = (center.lon * i + nodesCoordinates[i].lon) / (i + 1);
    }

    return center;
}

var obj;
var dir = '/Users/Armand/Google Drive/Master/Year 2/Semester 3/IoSL/Documents/Algorithm/Features/Sources/Edinburgh/'; // Directory with all the JSON files for a city.

var goodJSON = {
    types: []
};
var center;

fs.readdir(dir, function(err, files) {
    if (err)
        throw err;
    async.each(files, function(file, callback) {

        if (path.extname(file) == '.json') {
            fs.readFile(dir + file, 'utf8', function(err, data) {
                if (err)
                    throw err;

                var name = file.substring(file.indexOf('_') + 1);
                name = name.replace('_edinburgh.json', '');
                obj = JSON.parse(data);
                for (var i = 0; i < obj.elements.length; i++) {
                    if (i === 0) {
                        goodJSON.types.push(name);
                        goodJSON[name] = [];
                    }

                    if (name === 'zoo') {
                        console.log(obj.elements[i].type);
                        if (obj.elements[i].type === 'way') {
                            console.log(obj.elements[i].nodes);
                        }
                    }

                    if (obj.elements[i].tags !== undefined) { // A real feature
                        if (obj.elements[i].type == 'node') { // Simple coordinates
                            goodJSON[name].push({
                                lat: obj.elements[i].lat,
                                lon: obj.elements[i].lon
                            });
                        } else if (obj.elements[i].type === 'way') {
                            if (name === 'zoo') {
                                console.log(obj.elements[i]);
                            }
                            goodJSON[name].push(getCenter(obj.elements[i].nodes, obj.elements)); // Multiple coordinates, we need to compute the center
                        } else if (obj.elements[i].type === 'relation') {
                            for (var j = 0; j < obj.elements[i].members.length; j++) { // Add tags to the main elements of the relation so that we'll add them later.
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
            console.log('A file failed to process.');
        } else {
            fs.writeFile("./edinburgh.json", JSON.stringify(goodJSON), function(err) {
                if (err) {
                    return console.log(err);
                }

                console.log("The file was saved!");
            });
        }
    });
});
