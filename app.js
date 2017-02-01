const express = require('express')
	, app = express()
	, http = require('http').Server(app)
	, routeLoader = require('express_utils')
	, ROUTERPREFIX = '/'
	, PORT = 3000
	, morgan = require('morgan')
	, socketIO = require('socket.io')(http)
	;

// setting app constants
app.locals.__title = 'Chameleon Monitor';
app.locals.__description = 'Monitor UV light, temperature, and misting system water level.'


app.use(morgan('dev'));

app.use('/public', express.static(__dirname + '/public'));

// using pug templates
app.set('view engine', 'pug');

// render index page
app.get('/', function (req, res) {
  res.render('index');
});


// socket events
socketIO.on('connection', socket => {
	console.log('New connection!');

	socket.on('newUser', data => console.log(data));

	socket.on('disconnect', (text) => console.log(text));
});

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
function emitRandomValues () {
	if (!socketIO) {return;}

	let uv = getRandomInt(4, 6)/10;
	let temp = getRandomInt(70, 90);
	let date = Date.now();

	socketIO.emit('new-reading', {uv, temp, date});
};

setInterval(emitRandomValues, 1000);

// set the app to listen on port 3000
http.listen(PORT);

// log the port
console.log(`Up and running on localhost:${PORT}`);