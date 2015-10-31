/*jslint node: true */
'use strict';

var example = require('./example');

module.exports = {
    do: function(algorithm, parameters, callback) {
        switch (algorithm) {
            case 'example':
                example.get(parameters, callback);
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
            default:
                console.log('This algorithm does not exist');
        }
    }
};
