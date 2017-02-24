'use strict';

/**
 * This is used to run without microcontroller to test web client UI.
 * It simulates data streaming to the client.
 */

var express = require('express')
  , app = express()
  , fs = require('fs')
  , path = require('path')
  , http = require('http').createServer(app)
  , socketIO = require('socket.io')(http)
  , os = require('os')
  , address = 'localhost'
  , PORT = 3030
  , ledState = 0
  , _users = 0
  ;

app.use('/public', express.static(__dirname + '/public'));

app.get('/', function (req, res, next) {
  res.sendFile(path.join(__dirname + '/public/views/index.html'));
});

// socket events
socketIO.on('connection', function (socket) {
  console.log('New connection!');

  socket.on('newUser', function () {
    // update users count
    _users = socketIO.engine.clientsCount;
    console.log('Total users: ' + _users);
  });

  socket.on('toggleLed', function () {
    ledState = Math.abs(ledState - 1);
    // emit led was toggled
    socketIO.sockets.emit('led:toggled', {ledState: ledState});
  });

  socket.on('disconnect', function () {
    // update users count
    _users = socketIO.engine.clientsCount;
    console.log('Total users: ' + _users);
  });
});

// used for generating mock data
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// simulates micro controller sensor data
function emitRandomValues() {
  if (!socketIO) {
    return;
  }

  var uv = getRandomInt(4, 6) / 10;
  var temp = getRandomInt(70, 90);
  var date = Date.now();

  socketIO.emit('new-reading', {uv: uv, temp: temp, date: date});
}

// emit random values every second
setInterval(emitRandomValues, 1000);

// set the app to listen on port 3030
http.listen(PORT);

// log the port
console.log('Up and running on ' + address + ':' + PORT);