const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const EventHubReader = require('./scripts/event-hub-reader.js');

const iotHubConnectionString = "HostName=PlantMonitor.azure-devices.net;SharedAccessKeyName=service;SharedAccessKey=HA7929bOEoTSFF0v1hjWxssCT2DrjsLFyu/HTx2Wb/o=";
const eventHubConsumerGroup = "plantdata";


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
  if (message.body.waterLevel > 100) {
    counter += 1;
    if (counter == 1){
      client.messages.create({
        body: 'water plant pendejo Micheal Amor',
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

// Redirect requests to the public subdirectory to the root
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res /* , next */) => {
  res.redirect('/');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        console.log(`Broadcasting data ${data}`);
        client.send(data);
      } catch (e) {
        console.error(e);
      }
    }
  });
};

server.listen(process.env.PORT || '3000', () => {
  console.log('Listening on %d.', server.address().port);
});

const eventHubReader = new EventHubReader(iotHubConnectionString, eventHubConsumerGroup);

(async () => {
  await eventHubReader.startReadMessage((message, date, deviceId) => {
    try {
      const payload = {
        IotData: message,
        MessageDate: date || Date.now().toISOString(),
        DeviceId: deviceId,
      };

      wss.broadcast(JSON.stringify(payload));
    } catch (err) {
      console.error('Error broadcasting: [%s] from [%s].', err, message);
    }
  });
})().catch();
