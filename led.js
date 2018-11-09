var Gpio = require('onoff').Gpio;
var LED = new Gpio(4, 'out');

module.exports.blink = (numBlinks, intervalOverride) => (
  new Promise((resolve, reject) => {
    let interval = intervalOverride || 250
    blinkLED(interval, numBlinks * 2, resolve)
  })
)

const startBlink = (interval, numBlinks, callback) => {
  if(numBlinks > 0){
    setTimeout(() => {
      blinkLED(interval, numBlinks, callback)
    }, interval)
  }else{
    LED.writeSync(0);
    callback()
  }
}

const blinkLED = (interval, numBlinks, callback) => { //function to start blinking
  if (LED.readSync() === 0) { //check the pin state, if the state is 0 (or off)
    LED.writeSync(1); //set pin state to 1 (turn LED on)
  } else {
    LED.writeSync(0); //set pin state to 0 (turn LED off)
  }
  numBlinks--
  startBlink(interval, numBlinks, callback)
}

module.exports.ledOn = () => {
  if(LED.readSync() === 0){
    LED.writeSync(1)
  }
}

module.exports.ledOff = () => {
  if(LED.readSync() === 1){
    LED.writeSync(0)
  }
}

module.exports.cleanupLed = () => {
  LED.unexport()
}
