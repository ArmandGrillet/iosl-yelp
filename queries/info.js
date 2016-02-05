var utils = require('./utils');

function getBusinessInfo(business_id, callback) {
    utils.askDrill("select name, full_address, stars, review_count from " + utils.datasetPath('business') + " where business_id='" + business_id + "'", function(answer) {
        callback(answer.rows[0]);
    });
}

module.exports = {
    get: function(parameters, callback) {
        if (parameters.business_id === undefined) { // We only need to test name as city is always provided
            callback({
                error: 'Parameter business_id is undefined'
            });
        } else {
            getBusinessInfo(parameters.business_id, function(business) {
                callback(business);
            });
        }
    },
    test: function() {
        console.log("Test not yet implemented");
    }
};
