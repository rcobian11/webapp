
'use strict';

var connectionString = 'HostName=PlantMonitor.azure-devices.net;SharedAccessKeyName=service;SharedAccessKey=HA7929bOEoTSFF0v1hjWxssCT2DrjsLFyu/HTx2Wb/o=';
var { EventHubClient, EventPosition } = require('@azure/event-hubs');

var printError = function (err) {
  console.log(err.message);
};

var accountSid = 'ACffd410f50c9028c309e85d1ed73aeb80'; // Your Account SID from www.twilio.com/console
var authToken = '95e66449ea785c6f907214414157073c';   // Your Auth Token from www.twilio.com/console

var twilio = require('twilio');
var client = new twilio(accountSid, authToken);

var counter = 0;


var printMessage = function (message) {
  counter += 1;
  console.log(counter);
  if (message.body.waterLevel > 100) {
    if (counter == 1){
      client.messages.create({
        body: 'water plant pendejo \nMichaela ALbuja Amor',
        to: '+12096106350',  // Text this number
        from: '+12056428457' // From a valid Twilio number
      })
    }
    if (counter > 10){
      counter = 0;
    }
  }
};

// Connect to the partitions on the IoT Hub's Event Hubs-compatible endpoint.
// This example only reads messages sent after this application started.
var ehClient;
EventHubClient.createFromIotHubConnectionString(connectionString).then(function (client) {
  ehClient = client;
  return ehClient.getPartitionIds();
}).then(function (ids) {
  return ids.map(function (id) {
    return ehClient.receive(id, printMessage, printError, { eventPosition: EventPosition.fromEnqueuedTime(Date.now()) });
  });
}).catch(printError);
