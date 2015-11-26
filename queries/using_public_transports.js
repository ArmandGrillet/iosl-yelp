// Get the first business in Edinburgh and print its distance with the first transport station in the database.

var fs = require('fs'); // fs = filesystem.
var utils = require('./utils');

function getFirstBusiness(city, callback) {
    utils.askDrill("select name, latitude, longitude from " + utils.datasetPath('business') + " where city='" + city + "' limit 1", function(answer) {
        callback(answer.rows[0]);
    });
}

function getTransports(city, callback) {
    var transports = fs.readFileSync(utils.path('edinburgh_transport'), 'utf8'); // Reading the file yelp_academic_dataset_edinburgh_transport.json as a JSON file.
    callback(JSON.parse(transports));
}

module.exports = {
    get: function(parameters, callback) {
        if (parameters.business === undefined) { // We only need to test name as city is a mandatory attribute {
            callback({
                error: 'Parameter business is undefined'
            });
        } else {
            getFirstBusiness(parameters.city, function(business) {
                var transports = getTransports(parameters.city);
                var firstTransport = transports[0];
                console.log(firstTransport.longitude);
            });
        }
    },
    test: function() {
        getFirstBusiness('Edinburgh', function(business) {
            getTransports('Edinburgh', function(transports) {
                var firstTransport = transports[0];
                var distance = utils.distance(parseFloat(business.latitude), parseFloat(business.longitude), firstTransport.lat, firstTransport.lon);
                console.log(distance);
            });
        });
    }
};
