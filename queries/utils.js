/*jslint node: true */
'use strict';

var request = require('request');
var path = require('path');

module.exports = {
    askDrill: function(query, callback) {
        request.post(
            'http://localhost:8047/query.json', // Adress of Apache Drill
            {
                json: {
                    'queryType': 'SQL',
                    'query': query
                }
            },
            function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    callback(body);
                }
            }
        );
    },
    datasetPath: function(dataset) {
        return 'dfs.`' + path.normalize(__dirname + '/../../yelp_dataset_challenge_academic_dataset/') + 'yelp_academic_dataset_' + dataset + '.json`';
    }
};
