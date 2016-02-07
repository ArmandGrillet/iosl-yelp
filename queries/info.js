/* Sends back information about a business */

var utils = require('./utils'); // Functions used by multiple queries are in utils.

/* Get the information from drill using a business id */
function getBusinessInfo(business_id, callback) {
    utils.askDrill("select name, full_address, stars, review_count from " + utils.datasetPath('business') + " where business_id='" + business_id + "'", function(answer) {
        callback(answer.rows[0]);
    });
}

module.exports = {
    get: function(parameters, callback) {
        // We need a business_id to find the information.
        if (parameters.business_id === undefined) {
            callback({
                error: 'Parameter business_id is undefined'
            });
        } else {
            // Get the information and return it.
            getBusinessInfo(parameters.business_id, function(business) {
                callback(business);
            });
        }
    },
    test: function() {
        console.log("Test not yet implemented");
    }
};
