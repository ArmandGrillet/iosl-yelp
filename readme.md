# IoSL Project WiSe 2015/2016

## How to work on this project
### Required directories
- Clone this repository in an empty folder.
- Download the [Yelp dataset](https://www.yelp.com/dataset_challenge) and copy it in the folder.
- Download [Apache Drill](https://drill.apache.org/download/) and extract in in the folder.

You should now have three directories in the folder:

1. apache-drill-[version-number]
2. iosl-business-ws1516
3. yelp_dataset_challenge_academic_dataset

### Required software
To run our code you'll need [Node.js](https://nodejs.org/en/).

Our project is based on Apache Drill thus you should [start it](https://drill.apache.org/docs/starting-drill-on-linux-and-mac-os-x/) before doing anything else. If the [Web Interface of Drill](http://localhost:8047/) is live it's working!

### Running the web app
Open the terminal, go on the project directory. You'll first need to install the dependencies through `npm install`. Go on the 'webapp' directory and start our web app's engine with the command `node app.js`. Our web app is now [accessible using your Web browser](http://localhost:1337/).
