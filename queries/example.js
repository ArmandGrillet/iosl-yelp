var request = require('request');
var path = require('path');


function datasetPath(dataset) {
    return 'dfs.`' + path.normalize(__dirname + '/../../yelp_dataset_challenge_academic_dataset/') + 'yelp_academic_dataset_' + dataset + '.json`'
}

function doQuery(query, callback) {
    resp = {}
    request.post(
        'http://localhost:8047/query.json', // Adress of Apache Drill
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

// Your code
doQuery("select full_address, latitude, longitude from " + datasetPath('business') + " where city='Phoenix' and name = 'Burger King'", function(firstAnswer) {
    console.log("Localization of all the Burger King in Phoenix:");
    for (var row of firstAnswer.rows) {
        console.log('Latitude: ' + row.latitude + " - longitude: " + row.longitude);
    }
});