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
  var temp = new five.Thermometer({
    controller: "LM35",
    pin: "A0"
  });

  // log temp
  temp.on("change", function () {
    console.log("raw: ", this.value);
    console.log("celsius: %d", this.C);
    console.log("fahrenheit: %d", this.F);
    console.log("kelvin: %d", this.K);
  });
});