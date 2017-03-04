var express = require('express')
  , app = express()
  , fs = require('fs')
  , path = require('path')
  , http = require('http').createServer(app)
  , db_host = '192.168.1.20'
  , db_port = 28015
  , r = require('rethinkdbdash')({
      db: 'chameleon_monitor',
      servers: [{
        host: db_host,
        port: db_port
      }]
    })
  , insertMeasurement = require('./insertMeasurement')
  , getHistoricalData = require('./getMeasurements')
  , socketIO = require('socket.io')(http)
  , five = require('johnny-five')
  , os = require('os')
  , eth0 = os.networkInterfaces().apcli0
  , address = eth0 && eth0.length && eth0[0].address ? eth0[0].address : null
  , PORT = 3030
  , pumpState = 0
  , _temp = 0
  , _uv = 0
  , _users = 0
  , _drainLevel = 'low'
  , _date
  ;

app.use('/public', express.static(__dirname + '/public'));

// index route
app.get('/', function (req, res, next) {
  res.sendFile(path.join(__dirname + '/public/views/index.html'));
});

app.get('/temperature', function (req, res, next) {
  res.sendFile(path.join(__dirname + '/public/views/temperature.html'));
});

app.get('/uv', function (req, res, next) {
  res.sendFile(path.join(__dirname + '/public/views/uv.html'));
});

app.get('/api/temperature', function (req, res, next) {
  getHistoricalData(r, 'temp', function (err, data) {
    if (err) { return next(err); }

    res.json(data);
  });
});

app.get('/api/uv', function (req, res, next) {
  getHistoricalData(r, 'uv', function (err, data) {
    if (err) { return next(err); }

    res.json(data);
  });
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

  var pump = new five.Led(13);

  var temp = new five.Thermometer({
    pin: "A0",
    freq: 125,
    toCelsius: function (raw) {
      // adjusting to match 3.3v of 7688 DUO
      return (3.3 / 1024) * raw * 100;
    }
  });

  var uv = new five.Sensor({
    pin: "A1",
    freq: 125
  });

  var drainLevel = new five.Sensor({
    pin: "A2",
    freq: 250
  });

  temp.on('change', function () {
    _temp = this.F;
  });

  uv.on('change', function () {
    _uv =  Math.round(((3.3 / 1024) * this.raw * 10) * 1000 ) / 1000;
  });

  drainLevel.on('change', function () {
    _drainLevel = this.raw > 200 ? 'high' : 'low';

    // turn off pump when high drain level
    if (_drainLevel === 'high') {
      pump.off();
      pumpState = 0;
    }
  });

  // socket events
  socketIO.on('connection', function (socket) {
    console.log('New connection!');

    socket.on('newUser', function () {
      // update users count
      _users = socketIO.engine.clientsCount;
      console.log('Total users: ' + _users);
    });

    socket.on('togglePump', function () {
      if (_drainLevel === 'high') {
        // pump is disabled because of high level
        return;
      }

      pumpState = Math.abs(pumpState - 1);
      pump.toggle(pumpState);
      // emit led was toggled
      socketIO.sockets.emit('pump:toggled', {ledState: pumpState});
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

    socketIO.sockets.emit('new-reading', {
      date: _date,
      drainLevel: _drainLevel,
      temp: _temp,
      uv: _uv
    });
  }

  setInterval(function () {
    emitReadingsToClient();
    insertMeasurement(r, {
      temp: _temp,
      uv: _uv,
      date: Date.now()
    }, function (err, results) {
      if (err) { 
        return console.log('Unable to save measurement. \n' + err);
      }

      //console.log(results.changes[0].new_val);
    });
  }, 1000);

  // set the app to listen on PORT
  http.listen(PORT);

  // log the address and port
  console.log('Up and running on ' + address + ':' + PORT);
});

