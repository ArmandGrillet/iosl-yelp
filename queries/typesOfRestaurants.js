var request = require('request');
var path = require('path');


function datasetPath(dataset) {
    return 'dfs.`' + path.normalize(__dirname + '/../../yelp_dataset_challenge_academic_dataset/') + 'yelp_academic_dataset_' + dataset + '.json`';
}

function doQuery(query, callback) {
    resp = {};
    request.post(
        'http://localhost:8047/query.json', // Address of Apache Drill
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
}
// Your code
doQuery("select categories[0] as Categories_of_Restaurant_in_City, count(categories[0]) as Category_Count from " + datasetPath('business') + " where true=repeated_contains(categories,'Restaurants') and city='Phoenix' group by categories[0] order by count(categories[0]) desc",
    function(firstAnswer) {
        console.log("List of restaurant types in a city and there counts:");
        for (var i; i < firstAnswer.rows.length; i++) {
            console.log('There are ' + firstAnswer.rows[i].Category_Count + " " + firstAnswer.rows[i].Categories_of_Restaurant_in_City + " restaurant type in Phoenix");
        }
    }
);
