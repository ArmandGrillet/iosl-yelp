var utils = require('./utils');

function getBusinessInfo(business_id, callback) {
    console.log(business_id);
    utils.askDrill("select name, full_address from " + utils.datasetPath('business') + " where business_id='" + business_id + "'", function(answer) {
        console.log(answer);
        callback(answer.rows[0]);
    });
}

module.exports = {
    get: function(parameters, callback) {
        if (parameters.business_id === undefined) { // We only need to test name as city is a mandatory attribute {
            callback({
                error: 'Parameter business_id is undefined'
            });
        } else {
            getBusinessInfo(parameters.business_id, function(business) {
                console.log(business);
                callback(business);
            });
        }
    },
    test: function() {
        console.log("Test not yet implemented");
    }
};
