var m = require('mraa');
var ledState = true;
var myLed = new m.Gpio(44);
var temp = new m.Aio(0);

myLed.dir(m.DIR_OUT);


function periodicActivity() {
  myLed.write(ledState ? 1 : 0);
  ledState = !ledState;

  console.log('temp: ' + temp.read());
  setTimeout(periodicActivity, 500);
}
periodicActivity();