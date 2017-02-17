var router = require('tiny-router')
  , fs = require('fs')
  , http = require('http').createServer(router.Router())
  , socketIO = require('socket.io')(http)
  , firmata = require('firmata')
  , os = require('os')
  , PORT = 3030
  , ledPin = 13
  , ledState = 0
  ;


var board = new firmata.Board("/dev/ttyS0", function (err) {
  if (err) {
    console.log(err);
    board.reset();
    return;
  }

  console.log('connected...');
  console.log('board.firmware: ', board.firmware);

  board.pinMode(ledPin, board.MODES.OUTPUT);
  board.digitalWrite(ledPin, 0);

  board.pinMode(5, board.MODES.ANALOG);

  console.log('analogPin 5: ', board.pins[board.analogPins[5]].value);

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
      board.digitalWrite(ledPin, ledState);

      socketIO.emit('led:toggled', {ledState: ledState});

      console.log('analogPin 5: ', board.pins[board.analogPins[5]].value);
    });

    socket.on('disconnect', function (text) {
      console.log(text)
    });
  });

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function emitRandomValues() {
    if (!socketIO) {
      return;
    }

    var uv = Math.round(board.pins[board.analogPins[5]].value / 1023 * 1000) / 1000;
    var temp = getRandomInt(70, 73);
    var date = Date.now();

    socketIO.emit('new-reading', {uv: uv, temp: temp, date: date});
  };

  setInterval(function () {
    emitRandomValues();
  }.bind(this), 1000);

  // set the app to listen on port 3000
  http.listen(PORT);
  var eth0 = os.networkInterfaces().apcli0;

  var address = eth0 && eth0.length && eth0[0].address ? eth0[0].address : null;

  // log the port
  console.log('Up and running on ' + address + ':' + PORT);
});

