var m = require('mraa');
var ledState = true;
var myLed = new m.Gpio(44);
var temp = new m.Gpio(23);

myLed.dir(m.DIR_OUT);
temp.dir(m.DIR_IN);


function periodicActivity() {
  myLed.write(ledState ? 1 : 0);
  ledState = !ledState;

  console.log('temp: ' + temp.read());
  setTimeout(periodicActivity, 500);
}
periodicActivity();