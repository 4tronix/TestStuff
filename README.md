# MakeCode Package for 4tronix ServoBit Servo Controller Board

The [4tronix ServoBit](https://4tronix.co.uk/servobit) uses a PCA9685 to control 16 independent servos.
Helper commands are available to centre all servos, or set individual servos to any angle from -90 to +90 degrees

It is also possible to set the speed at which each servo moves to its new position, which gives a smoother operation

In addition, the 4tronix ServoBit contains a single Smart RGB status LED which can be set to any colour and brightness
and a flashing function is also available.


## Setting the servos

![](http://4tronix.co.uk/servobit/centreServos.jpg)

![](http://4tronix.co.uk/servobit/setServo.jpg)

```blocks
// Set all 16 servos to the centre position
ServoBit.centreServos();

// Set Servo 5 to +30 degrees
ServoBit.setServo(5, 30);

// Set Servo 13 to -90 degrees
ServoBit.setServo(13, -90);
```

## Controlling servo movements and speeds
You can control the number of degrees per second that the servo moves. A typical servo would have a maximum speed of around 500 degrees per second.
Reasonable values for slower movements are between 30 and 200 degrees per second, although a range of 1 to 1000 is supported.
Setting the servo position whilst it is still moving, will cancel the movement command.
Creating a new movement command for a servo with an existing movement will cancel the first and then start the second.
You can also check if the servo has reached its target position, or wait until it has completed.

![](http://4tronix.co.uk/servobit/moveServo.jpg)

![](http://4tronix.co.uk/servobit/servoActual.jpg)

![](http://4tronix.co.uk/servobit/servoTarget.jpg)

![](http://4tronix.co.uk/servobit/servoComplete.jpg)

![](http://4tronix.co.uk/servobit/waitServo.jpg)


```blocks
// Move servo 5 to 30 degrees at 40 degrees per second
ServoBit.moveServo(5, 30, 40);

// Check current actual position of servo 5
let variable = ServoBit.getServoActual(5);

// check current target positon for servo 5
let variable = ServoBit.getServoTarget(5);

// Wait for servo 5 to complete its movement
ServoBit.waitServo(5);
```

## Smart RGB LED helpers

The 4tronix ServoBit has a single smart RGB LED (aka neopixel) fitted. This library defines some helpers
for using it.
The LED is automatically updated after every setting

![](http://4tronix.co.uk/servobit/clearLed.jpg)

![](http://4tronix.co.uk/servobit/setLed.jpg)

![](http://4tronix.co.uk/servobit/setBrightness.jpg)

![](http://4tronix.co.uk/servobit/startFlash.jpg)

![](http://4tronix.co.uk/servobit/stopFlash.jpg)


```blocks
// Clear LED
ServoBit.ledClear();

// Set LED to Red
ServoBit.setLedColor(ServoBit.vColours(vColors.Red));

// Set brightness of LED
ServoBit.ledBrightness(40);

// Start Flashing the LED with Green
ServoBit.startFlash(ServoBit.vColours(vColors.Green), 100);

// Stop flashing the LED
ServoBit.stopFlash();
```


## Supported targets

* for PXT/microbit

## License

MIT
