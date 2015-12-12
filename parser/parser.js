/*jslint node: true */

'use strict';

var async = require('async');
var fs = require('fs');
var path = require('path');

var obj;
var dir = '/Users/Armand/Google Drive/Master/Year 2/Semester 3/IoSL/Documents/Algorithm/Features/Edinburgh/';

var goodJSON = {
    types: []
};

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
                        console.log("On push le name");
                        goodJSON.types.push(name);
                        goodJSON[name] = [];
                    }
                    if (obj.elements[i].type == 'node') {
                        goodJSON[name].push({
                            lat: obj.elements[i].lat,
                            lon: obj.elements[i].lon
                        });
                    }
                }
                callback();
            });
        } else {
            callback();
        }
    }, function(err) {
        if (err) {
            console.log('A file failed to process');
        } else {
            console.log("Everything worked");
            console.log(goodJSON.types);
            fs.writeFile("./edinburgh.json", JSON.stringify(goodJSON), function(err) {
                if (err) {
                    return console.log(err);
                }

                console.log("The file was saved!");
            });
        }
    });
});
