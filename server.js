
'use strict';

var connectionString = 'HostName=PlantMonitor.azure-devices.net;SharedAccessKeyName=service;SharedAccessKey=HA7929bOEoTSFF0v1hjWxssCT2DrjsLFyu/HTx2Wb/o=';
var { EventHubClient, EventPosition } = require('@azure/event-hubs');

var printError = function (err) {
  console.log(err.message);
};

var accountSid = 'ACffd410f50c9028c309e85d1ed73aeb80'; // Your Account SID from www.twilio.com/console
var authToken = '';   // Your Auth Token from www.twilio.com/console

var twilio = require('twilio');
var client = new twilio(accountSid, authToken);

var wlcounter = 0;
var hcounter = 0;
var tcounter = 0;


var printMessage = function (message) {
  if (message.body.waterLevel > 100) {
    wlcounter += 1;
    if (wlcounter == 1){
      client.messages.create({
        body: 'Water content is low. Water plant.',
        to: '+12096106350',  // Text this number
        from: '+12056428457' // From a valid Twilio number
      })
    }
    if (wlcounter > 10){
      wlcounter = 0;
    }
  }
  else{
    wlcounter = 0;
  }
  if (message.body.temperature > 33) {
    tcounter += 1;
    if (tcounter == 1){
      client.messages.create({
        body: 'temperature is to hot move plant to shade',
        to: '+12096106350',  // Text this number
        from: '+12056428457' // From a valid Twilio number
      })
    }
    if (tcounter > 10){
      tcounter = 0;
    }
  }
  else{
    tcounter = 0;
  }
  if (message.body.humidity > 80) {
    hcounter += 1;
    if (hcounter == 1){
      client.messages.create({
        body: 'humidity is very high. move plant to dry area',
        to: '+12096106350',  // Text this number
        from: '+12056428457' // From a valid Twilio number
      })
    }
    if (hcounter > 10){
      hcounter = 0;
    }
  }
  else{
    hcounter = 0;
  }
};

// Connect to the partitions on the IoT Hub's Event Hubs-compatible endpoint.
// This example only reads messages sent after this application started.
var ehClient;
EventHubClient.createFromIotHubConnectionString(connectionString).then(function (client) {
  console.log("Successfully created the EventHub Client from iothub connection string.");
  ehClient = client;
  return ehClient.getPartitionIds();
}).then(function (ids) {
  console.log("The partition ids are: ", ids);
  return ids.map(function (id) {
    return ehClient.receive(id, printMessage, printError, { eventPosition: EventPosition.fromEnqueuedTime(Date.now()) });
  });
}).catch(printError);
