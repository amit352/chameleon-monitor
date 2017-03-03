// test rehtinkdbdash 
var r = require('rethinkdbdash')({
      db: 'chameleon_monitor',
      servers: [{
        host: 'localhost',
        port: 28015
      }]
    })
  , insertMeasurement = require('./insertMeasurement')
  , _temp = 0
  , _uv = 0
  , _users = 0
  , _date
  ;

// used for generating mock data
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// simulates micro controller sensor data
function emitRandomValues() {
  if (!socketIO) {
    return;
  }

  uv = getRandomInt(4, 6) / 10;
  temp = getRandomInt(70, 90);
  date = Date.now();

  socketIO.emit('new-reading', {uv: uv, temp: temp, date: date});
}

setInterval(function () {
	insertMeasurement(r, {
		uv: getRandomInt(4, 6) / 10,
  	temp: getRandomInt(70, 90),
  	date: Date.now()
	}, function (err, results) {
		if (err) {
			return console.log(err);
		}

		console.log(results.changes[0].new_val);
	});
}, 1000);

