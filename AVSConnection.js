'use strict'

const http2 = require('http2')
const fs = require('fs');


var spdy = require('spdy');
var https = require('https');


const avs_base_url = 'avs-alexa-na.amazon.com'
const avs_version = 'v20160207'

var token = null;

function AVSConnection () {

  fs.readFile('./access_token.json', (err, data) => {
    if(err) {
      console.error(err);
      process.exit(1);
    }
    if(data) {
      token = JSON.parse(data.toString()).token;
      console.log(token);
    }
  });

}


function getSyncStateBroundaryTerms(AlertsState, PlaybackState, VolumeState, SpeechState){

  var syncStateBoundaryTerm = "Content-Disposition: form-data;" +
  "name=\"metadata\"" + "Content-Type: application/json; charset=UTF-8";

  var syncStateBoundaryObj = {
      "context": [
          AlertsState,
          PlaybackState,
          VolumeState,
          SpeechState
      ],
      "event": {
          "header": {
              "namespace": "System",
              "name": "SynchronizeState",
              "messageId": "{{STRING}}"
          },
          "payload": {
          }
      }
  }

  syncStateBoundaryTerm += JSON.stringify(syncStateBoundaryObj);
  return syncStateBoundaryTerm;
}


/**
 * Connect transaction
*/
var myReq = null;
const myAgent = spdy.createAgent({
  host: avs_base_url,
  port: 443,
  spdy : {
    plain : false
  }
});

AVSConnection.prototype.connectSpdy = () => {


  //create an HTTP/2 Connection
  var optCreating = {
    hostname: avs_base_url,
    agent: myAgent,
    port: 443,
    path: '/' + avs_version + '/directives',
    method: 'GET',
    headers: { authorization : 'Bearer ' + token }
  };

  var req = https.get(optCreating, function(response) {
    response.on('data', function(data) {
      console.log('response stream: ' + data.toString('utf-8'));
    });
    response.on('end', function() {
      console.log('response stream end');
    });

  });

  req.on('push', function(stream) {
    stream.on('data', function(data) {
      console.log('push stream: '+ data.toString('utf-8'));
    });
    stream.on('end', function() {
      console.log('push stream end');
    });
  });


  console.log("[POST] event state....");
  const syncStateBoundaryTerm = getSyncStateBroundaryTerms("", "", "", "");

  var optSyncState = {
    hostname: avs_base_url,
    agent: myAgent,
    port: 443,
    path: '/' + avs_version + '/events',
    method: 'POST',
    headers: { 
      authorization : 'Bearer ' + token,
      'Content-Type' : 'multipart/form-data',
      'boundary' : syncStateBoundaryTerm
    }
  };
  

  var req2 = https.request(optSyncState, function(response) {
    response.on('data', function(data) {
      console.log('response stream: ' + data.toString('utf-8'));
    });
    response.on('end', function() {
      console.log('response stream end');
    });
  });

  req2.on('push', function(stream) {
    stream.on('data', function(data) {
      console.log('push stream: '+ data.toString('utf-8'));
    });
    stream.on('end', function() {
      console.log('push stream end');
    });
  });

}

AVSConnection.prototype.connect = () => {
  //create an HTTP/2 Connection
  var optCreating = {
    hostname: avs_base_url,
    port: 443,
    path: '/' + avs_version + '/directives',
    method: 'GET',
    headers: { authorization : 'Bearer ' + token }
  };

  myReq = http2.request(optCreating, function(response) {
    response.pipe(process.stdout);
  });

  if(myReq === null || myReq === undefined) {
    process.exit(1);
  }

  myReq.on('error', (err) => {
    console.error(err);
  })


  const syncStateBoundaryTerm = getSyncStateBroundaryTerms("", "", "", "");
  
  var optSyncState = {
    hostname: avs_base_url,
    port: 443,
    path: '/' + avs_version + '/events',
    method: 'POST',
    headers: { 
      authorization : 'Bearer ' + token,
      'Content-Type' : 'multipart/form-data',
      'boundary' : syncStateBoundaryTerm
    }   

  };
  
  console.log("[POST] event state");

  http2.request(optSyncState, function(response) {
    response.pipe(process.stdout);
  });

}

module.exports = AVSConnection;