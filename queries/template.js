/* A function doing nothing as it's a template. */

var utils = require('./utils'); // Functions used by multiple queries are in utils.

// Write the inner functions here.
function empty(callback) {
    callback("Nothing has been done for this algorithm yet.");
}

module.exports = {
    get: function(parameters, callback) {
        // Parameters are given by the map, check the Wiki for more info: https://gitlab.tubit.tu-berlin.de/fvictor257/iosl-business-ws1516/wikis/interacting-with-the-back-end
        empty(function(answer) {
            callback({
                error: 'This algorithm has not been implemented yet.'
            });
        });
    },
    test: function() {
        empty(function(answer) {
            console.log("Result of the algorithm: ");
            console.log(answer);
        });
    }
};
