/*jslint node: true */

'use strict';

var express = require('express');
var queriesManager = require('../queries/manager');
var request = require('request');

var app = express();

app.use(express.static('public'));

app.get('/mapquery', function(req, res) {
    var query = req.query;
    var algorithm = query.algorithm;
    delete query.algorithm;
    console.log(algorithm);
    console.log(query);
    queriesManager.do(algorithm, query, function(result) {
        res.send(result);
    });
});

var server = app.listen(1337, function() {
    var port = server.address().port;

    console.log('Listening on port %s', port);
});
