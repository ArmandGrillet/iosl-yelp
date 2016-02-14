/* Call the right function with the name of the query. */

/*jslint node: true */
'use strict';

var businesses = require('./businesses');
var example = require('./example');
var gridExample = require('./grid_example');
var hotgrid = require('./hotgrid');
var hotspots = require('./hotspots');
var hotzones = require('./hotzones');
var info = require('./info');
var success = require('./success');

module.exports = {
    do: function(algorithm, parameters, callback) {
        switch (algorithm) {
            case 'businesses':
                businesses.get(parameters, callback);
                break;
            case 'example':
                example.get(parameters, callback);
                break;
            case 'hotspots':
                hotspots.get(parameters, callback);
                break;
            case 'gridExample':
                gridExample.get(parameters, callback);
                break;
            case 'hotgrid':
                hotgrid.get(parameters, callback);
                break;
            case 'hotzones':
                hotzones.get(parameters, callback);
                break;
            case 'info':
                info.get(parameters, callback);
                break;
            case 'success':
                success.get(parameters, callback);
                break;
            default:
                callback({
                    error: 'Query does not exist'
                });
        }
    },
    test: function(algorithm) {
        // For tests we don't use parameters, we directly modify the file containing the algorithm.
        switch (algorithm) {
            case 'businesses':
                businesses.test();
                break;
            case 'gridExample':
                gridExample.test();
                break;
            case 'hotspots':
                hotspots.test();
                break;
            case 'hotgrid':
                hotgrid.test();
                break;
            case 'hotspots':
                hotzones.test();
                break;
            case 'hotzones':
                hotzones.test();
                break;
            case 'info':
                info.test();
                break;
            case 'success':
                success.test();
                break;
            default:
                console.log('This algorithm does not exist');
        }
    }
};
