/* The heart of our application, displays the front-end and listen for messages from it */

/*jslint node: true */

'use strict';

var express = require('express'); // We use the Express framework to do the routing.
var queriesManager = require('../queries/manager'); // We use the queriesManager to send the query and receive information.

var app = express(); // Our application.

app.use(express.static('public')); // Everything in the public folder is accessible directly (contains the website).

app.get('/query', function(req, res) { // Called when we do a GET request on /query
    var query = req.query; // Get the query.
    // Get the algorithm of the query and delete it from the request.
    var algorithm = query.algorithm;
    delete query.algorithm;

    // Send the query to the query manager and wait for the answer
    queriesManager.do(algorithm, query, function(result) {
        // Sends the answer back to the front-end
        res.send(result);
    });
});

// Listen on the port 1337.
var server = app.listen(1337, function() {
    var port = server.address().port;

    console.log('Listening on port %s', port);
});
