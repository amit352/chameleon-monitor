const router = require('tiny-router')
  , fs = require('fs')
  , http = require('http').createServer(router.Router())
  , PORT = 3030
  , socketIO = require('socket.io')(http)
  ;

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
socketIO.on('connection', socket => {
  console.log('New connection!');

  socket.on('newUser', data => console.log(data));

  socket.on('disconnect', text => console.log(text));
});

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function emitRandomValues() {
  if (!socketIO) {
    return;
  }

  let uv = getRandomInt(4, 6) / 10;
  let temp = getRandomInt(70, 90);
  let date = Date.now();

  socketIO.emit('new-reading', {uv, temp, date});
};

setInterval(emitRandomValues, 1000);

// set the app to listen on port 3000
http.listen(PORT);

// log the port
console.log(`Up and running on localhost:${PORT}`);