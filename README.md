# MakeCode Package for 4tronix Robobit Buggy Robot

This library provides a Microsoft Makecode package for 4tronix Robobit Buggy all versions, see
https://4tronix.co.uk/robobit/

## Selecting the Product Version
The RoboBit Buggy has evolved through Mk1, Mk2 and now Mk3. These use slightly different pins for the options sensors.
Additionally using the LedBar with Mk2 forces the Ultrasonic to change pins
So it is important to set the model of  RoboBit at the start of the program:

```blocks
// Select Mk3 RoboBit
robobit.select_model(RBModel.Mk3);
```   

## Driving the robot    
The simplest way to drive the robot is by using the `go(...)` or `goms(...)` blocks.
With each of these blocks you specify Forward or Reverse, and a speed from 0 to 100.
Both motors will be driven at the selected speed and direction.
```blocks
// Move forward at speed 60 forever
robobit.go(RBDirection.Forward, 60)

// Move backward at speed 100 for 2000 ms
robobit.goms(RBDirection.Reverse, 100, 2000)
```
You can also spin/rotate the robot with the `rotate(...)` or `rotatems(...)` blocks
```blocks
// Rotate left at speed 70
robobit.rotate(RBRobotDirection.Left, 70)

// Rotate right at speed 50 for 400ms
robobit.rotatems(RBRobotDirection.Right, 50, 400)
```   

## Stopping
When the motor speed is set to zero then it stops. However, we can also use the motor itself to create a reverse generated current to brake much quicker.
This helps when aiming for more accurate manoeuvres. Use the `stop(...)` command to stop with braking, or coast to a halt.
```blocks
robobit.stop(RBStopMode.Coast) # slowly coast to a stop
robobit.stop(RBStopMode.Brake) # rapidly brake
```

## Driving the motors individually

If you want more fine grain control of individal motors, use `robobit.move(...)` to drive each motor either forward or reverse.
You can specify the direction (Forward or Reverse) and speed between 0 and 100.
If the left motor turns slower than the right motor, the robot will turn to the left
```blocks
// Drive both motors forward at speed 60. Equivalent to robobit.go(RBDirection.Forward, 60)
robobit.move(RBMotor.Both, RBDirection.Forward, 60)

// Drive left motor in reverse at speed 30
robobit.move(RBMotor.Left, RBDirection.Reverse, 30)

// Drive forward in a leftward curve
robobit.move(RBMotor.Left, RBDirection.Forward, 40)
robobit.move(RBMotor.Right, RBDirection.Forward, 70)
```

## Making the Robot Drive Straight

The small DC motors used in the Robobit and many other small robots are not guaranteed to go at the same speed as each other.
This can cause the robot to veer off the straight line, either to left or to right, even when both motors are programmed to go
at the same speed.
We can partially correct for this by adding a direction bias to the motor speed settings.
If your robot is veering to the right, then set the bias to the left.
Conversely, if your robot is turning to the left, then set the bias to the right.
It varies with speed and battery condition etc, but an approximation is that a 10% bias will result in about 15cm (6 inches)
change of course over about 2m (6 feet).
Note that the bias setting does not affect the old style motor blocks.

```blocks
// eg. robot leaves straight line to the right by about 10cm over 2m, so bias it to the left by 5%
robobit.RBBias(RBRobotDirection.Left, 5)

// eg. robot leaves straight line to left by 25cm, so bias it to the right by 15%
robobit.RBBias(RBRobotDirection.Right, 15)
```

## Read line sensor

The Robobit (optionally) has two line-sensors: left and right. To read the value of the
sensors, use `robobit.readLine(..)` function.

```blocks
// Read left and right line sensor
let left = robobit.readLine(RBLineSensor.Left);
let right = robobit.readLine(RBLineSensor.Right);
```

## Read sonar value

If you have mounted the optional sonar sensor for the Robobit you can
also use the `robobit.sonar(..)` function to read the distance to obstacles.

```blocks
// Read sonar values
let v1 = robobit.sonar(RBPingUnit.MicroSeconds);
let v2 = robobit.sonar(RBPingUnit.Centimeters);
let v3 = robobit.sonar(RBPingUnit.Inches);
```

## NeoPixel helpers

The Robobit optionally has 8 NeoPixels mounted on a LEDBar. This library defines some helpers
for using the NeoPixels.

```blocks
// Show all leds
robobit.setColor(neopixel.colors(NeoPixelColors.Red));
robobit.neoShow();

// Clear all leds
robobit.neoClear();
robobit.neoShow();

// Show led at position 1 (0 to 7)
robobit.setPixel(1, neopixel.colors(NeoPixelColors.Red));
robobit.neoShow();

// Show led rainbow
robobit.neoRainbow();
robobit.neoShow();

// Show led rainbow and shift
robobit.neoRainbow();
robobit.neoShift();
robobit.neoShow();

// Show led rainbow and rotate
robobit.neoRainbow();
robobit.neoRotate();
robobit.neoShow();

// Set brightness of leds (0 to 255)
robobit.neoBrightness(100);
robobit.neoShow();

// Start the scanner to run in the background at the speed and colour you choose
robobit.startScanner(robobit.RBColours(RBColors.Red), 100);
// and stop it with
robobit.stopScanner();

// Define your own colours using convertRGB(red, green, blue)
robobit.setColor(robobit.convertRGB(40, 50, 200));
robobit.neoShow();
```

## Supported targets

* for PXT/microbit

## License

MIT
