var express = require('express')
  , app = express()
  , fs = require('fs')
  , path = require('path')
  , http = require('http').createServer(app)
  , r = require('rethinkdbdash')({
      db: 'chameleon_monitor',
      servers: [{
        host: '192.168.1.249', 
        port: 28015
      }]
    })
  , insertMeasurement = require('./insertMeasurement')
  , socketIO = require('socket.io')(http)
  , five = require('johnny-five')
  , os = require('os')
  , eth0 = os.networkInterfaces().apcli0
  , address = eth0 && eth0.length && eth0[0].address ? eth0[0].address : null
  , PORT = 3030
  , ledState = 0
  , _temp = 0
  , _uv = 0
  , _users = 0
  , _date
  ;

app.use('/public', express.static(__dirname + '/public'));

app.get('/', function (req, res, next) {
  res.sendFile(path.join(__dirname + '/public/views/index.html'));
});

var board = new five.Board({
  port: "/dev/ttyS0"
});

board.on('ready', function (err) {
  if (err) {
    console.log(err);
    board.reset();
    return;
  }

  console.log('connected...Johnny-Five ready to go.');

  var led = new five.Led(13);

  var temp = new five.Thermometer({
    pin: "A0",
    freq: 250,
    toCelsius: function (raw) {
      // adjusting to match 3.3v of 7688 DUO
      return (3.3 / 1024) * raw * 100;
    }
  });

  var uv = new five.Sensor({
    pin: "A1",
    freq: 250,
    thresh: 0.5
  });

  temp.on('change', function () {
    _temp = this.F;
  });

  uv.on('change', function () {
    _uv = (3.3 / 1024) * this.value * 10;
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
      led.toggle(ledState);
      // emit led was toggled
      socketIO.sockets.emit('led:toggled', {ledState: ledState});
    });

    socket.on('disconnect', function () {
      // update users count
      _users = socketIO.engine.clientsCount;
      console.log('Total users: ' + _users);
    });
  });

  function emitReadingsToClient() {
    if (!socketIO) {
      return;
    }

    _date = Date.now();

    socketIO.sockets.emit('new-reading', {uv: _uv, temp: _temp, date: _date});
  };

  setInterval(function () {
    emitReadingsToClient();
    insertMeasurement(r, {
      temp: _temp,
      uv: _uv,
      date: Date.now()
    }, function (err, results) {
      if (err) { 
        return console.log('Unable to save measurement. \n\n ' + err);
      }

      cosnole.log(results.changes[0].new_val);
    })
  }, 1000);

  // set the app to listen on port 3000
  http.listen(PORT);

  // log the port
  console.log('Up and running on ' + address + ':' + PORT);
});

