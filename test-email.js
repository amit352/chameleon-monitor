var sendHighAlertEmail = require('./sendHighAlertEmail');
var _lastEmailDate = 0;

// this test example should only send 1 email and the 2nd should log that it was already sent

// send high level alarm email every hour
if (Date.now() - _lastEmailDate > 3600000) {
  sendHighAlertEmail(_lastEmailDate, function (err, info) {
    if (err) {
      return console.log(err);
    }

    _lastEmailDate = Date.now();
  });
}

setTimeout(function () {
  sendHighAlertEmail(_lastEmailDate, function(err, info) {
    if (err) {return console.log(err);}
    console.log(info);
  });
}, 10000);

