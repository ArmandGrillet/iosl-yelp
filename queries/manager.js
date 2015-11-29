/*jslint node: true */
'use strict';

var businesses = require('./businesses');
var example = require('./example');
var grid_example = require('./grid_example');
var finding_hotspot = require('./finding_hotspot');
var hotzones = require('./hotzones');
var info = require('./info');
var using_public_transports = require('./using_public_transports');
var transport = require('./transport');
var success_algo = require('./success_algo');

module.exports = {
    do: function(algorithm, parameters, callback) {
        switch (algorithm) {
            case 'businesses':
                businesses.get(parameters, callback);
                break;
            case 'example':
                example.get(parameters, callback);
                break;
            case 'finding_hotspot':
                finding_hotspot.get(parameters, callback);
                break;
            case 'grid_example':
                grid_example.get(parameters, callback);
                break;
            case 'hotzones':
                hotzones.get(parameters, callback);
                break;
            case 'info':
                info.get(parameters, callback);
                break;
            case 'success_algo':
                success_algo.get(parameters, callback);
                break;
            default:
                callback({
                    error: 'Query does not exist'
                });
        }
    },
    test: function(algorithm) {
        switch (algorithm) {
            case 'businesses':
                businesses.test();
                break;
            case 'example':
                example.test(); // For the tests we don't use parameters, we directly modify the file containing the algorithm.
                break;
            case 'finding_hotspot':
                finding_hotspot.test();
                break;
            case 'hotzones':
                hotzones.test();
                break;
            case 'info':
                info.test();
                break;
            case 'using_public_transports':
                using_public_transports.test();
                break;
            case 'transport':
                transport.test();
                break;
            case 'success_algo':
                success_algo.test();
                break;
            default:
                console.log('This algorithm does not exist');
        }
    }
};
