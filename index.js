const cors = require('cors')({origin: true});
const express = require('express');
const functions = require('firebase-functions');

const action = require('./action');
const listing = require('./listing');

const server = express();
server.use(cors);


/** All http end points **/
server.post('/update', (req, res) => {
    console.log('Started update');
    res.set('Access-Control-Allow-Origin', '*');
    return listing.update(req, res);
});

server.post('/find', (req, res) => {
    console.log('Started find');
    res.set('Access-Control-Allow-Origin', '*');
    return listing.find(req, res);
});

server.post('/search', (req, res) => {
    console.log('Started search');
    res.set('Access-Control-Allow-Origin', '*');
    return listing.search(req, res);
});

server.post('/action', (req, res) => {
    console.log('Started action');
    res.set('Access-Control-Allow-Origin', '*');
    return action.run(req, res);
});


exports.app = functions.https.onRequest(server);