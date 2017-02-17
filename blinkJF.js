var five = require("johnny-five");

// Johnny-Five will try its hardest to detect the port for you,
// however you may also explicitly specify the port by passing
// it as an optional property to the Board constructor:
var board = new five.Board({
  port: "/dev/ttyS0"
});

// The board's pins will not be accessible until
// the board has reported that it is ready
board.on("ready", function () {
  var sensor = new five.Sensor("A0");

  // log adc value of sensor
  sensor.on("change", function () {
    console.log(this.value);
  });
});