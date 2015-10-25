'use strict';

var express = require('express');
var path = require('path');
var query = require('./query');
var request = require('request');

var app = express();


app.use(express.static('public'));

app.get('/businesses', function (req, res) {
	doQuery("select name, latitude, longitude from " + datasetPath('business') + " where true=repeated_contains(categories,'" + req.query.business + "') and city='" + req.query.city + "'", 
		function(businesses) {
    		res.send(businesses);
		}
	);
});

var server = app.listen(1337, function () {
  	var port = server.address().port;

  	console.log('Listening on port %s', port);
});

function datasetPath(dataset) {
    return 'dfs.`' + path.normalize(__dirname + '/../../yelp_dataset_challenge_academic_dataset/') + 'yelp_academic_dataset_' + dataset + '.json`'
}

function doQuery(query, callback) {
    request.post(
        'http://localhost:8047/query.json', // Address of Apache Drill
        { 
            json: {
                'queryType': 'SQL',
                'query': query
            }
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                callback(body);
            }
        }
    );
}