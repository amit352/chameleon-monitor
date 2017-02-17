var router = require('tiny-router')
  , fs = require('fs')
  , http = require('http').createServer(router.Router())
  , socketIO = require('socket.io')(http)
  , five = require('johnny-five')
  , os = require('os')
  , eth0 = os.networkInterfaces().apcli0
  , address = eth0 && eth0.length && eth0[0].address ? eth0[0].address : null
  , PORT = 3030
  , ledState = 0
  , _temp = 0
  , _uv = 0
  , _date
  ;


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

  temp.on('change', function () {
    _temp = this.F;
  });

  router.use('defaultPage', './public/views/index.html');

  router.use('public', {path: __dirname + '/public'});

  // render index page
  router.get('/', function (req, res) {
    fs.readFile('./public/views/index.html', function (err, html) {
      if (err) {
        throw err;
      }
      res.writeHeader(200, {"Content-Type": "text/html"});
      res.write(html);
      res.end();
    });
  });

  // socket events
  socketIO.on('connection', function (socket) {
    console.log('New connection!');

    socket.on('newUser', function (data) {
      console.log(data)
    });

    socket.on('toggleLed', function () {
      ledState = Math.abs(ledState - 1);
      led.set(ledState);

      socketIO.emit('led:toggled', {ledState: ledState});
    });

    socket.on('disconnect', function (text) {
      console.log(text)
    });
  });

  function emitReadingsToClient() {
    if (!socketIO) {
      return;
    }

    _uv = .2;
    _date = Date.now();

    socketIO.emit('new-reading', {uv: _uv, temp: _temp, date: _date});
  };

  setInterval(function () {
    emitReadingsToClient();
  }.bind(this), 1000);

  // set the app to listen on port 3000
  http.listen(PORT);

  // log the port
  console.log('Up and running on ' + address + ':' + PORT);
});

