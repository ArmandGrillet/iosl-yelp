/*jslint node: true */
'use strict';

var example = require('./example');
var grid_example = require('./grid_example');
var finding_hotspot = require('./finding_hotspot');

module.exports = {
    do: function(algorithm, parameters, callback) {
        switch (algorithm) {
            case 'example':
                example.get(parameters, callback);
                break;
            case 'finding_hotspot':
                finding_hotspot.get(parameters, callback);
                break;
            case 'grid_example':
                grid_example.get(parameters, callback);
                break;
            default:
                callback({
                    error: 'Query does not exist'
                });
        }
    },
    test: function(algorithm) {
        switch (algorithm) {
            case 'example':
                example.test(); // For the tests we don't use parameters, we directly modify the file containing the algorithm.
                break;
            case 'finding_hotspot':
                finding_hotspot.test();
                break;
            default:
                console.log('This algorithm does not exist');
        }
    }
};
