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
  // This requires OneWire support using the ConfigurableFirmata
  // not sure if that is on the current firmata version installed on
  // linkit 7688 duo
  var thermometer = new five.Thermometer({
    controller: "DS18B20",
    pin: "D0"
  });

  thermometer.on("change", function() {
    console.log(this.celsius + "°C");
    // console.log("0x" + this.address.toString(16));
  });
});

