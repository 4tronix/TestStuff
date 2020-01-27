
/**
  * Enumeration of motors.
  */
enum mbMotor
{
    //% block="left"
    Left,
    //% block="right"
    Right,
    //% block="both"
    Both
}

/**
  * Enumeration of forward/reverse directions
  */
enum mbDirection
{
    //% block="forward"
    Forward,
    //% block="reverse"
    Reverse
}

/**
  * Enumeration of left/right directions
  */
enum mbRobotDirection
{
    //% block="left"
    Left,
    //% block="right"
    Right
}

/**
  * Stop modes. Coast or Brake
  */
enum mbStopMode
{
    //% block="no brake"
    Coast,
    //% block="brake"
    Brake
}

/**
  * Enable/Disable for Bluetooth and FireLeds
  */
enum mbBluetooth
{
    //% block="Enable"
    btEnable,
    //% block="Disable"
    btDisable
}

/**
 * Ping unit for sensor. Optional Accessory
 */
enum mbPingUnit
{
    //% block="cm"
    Centimeters,
    //% block="inches"
    Inches,
    //% block="μs"
    MicroSeconds
}

/**
  * Line sensors. Optional Accessory
  */
enum mbLineSensors
{
    //% block="left"
    Left,
    //% block="centre"
    Centre,
    //% block="right"
    Right
}

/**
 * Line Sensor events
 */
enum mbEvents {
    //% block="found"
    findLine = DAL.MICROBIT_PIN_EVT_RISE,
    //% block="lost"
    loseLine = DAL.MICROBIT_PIN_EVT_FALL
}

/**
 * Pins used to generate events
 */
enum mbPins {
    //% block="left"
    leftLine = <number>DAL.MICROBIT_ID_IO_P0,
    //% block="centre"
    centreLine = DAL.MICROBIT_ID_IO_P1,
    //% block="right"
    rightLine = DAL.MICROBIT_ID_IO_P2
}



/**
  * Update mode for LEDs
  * setting to Manual requires show LED changes blocks
  * setting to Auto will update the LEDs everytime they change
  */
enum mbMode
{
    Manual,
    Auto
}

/**
  * Pre-Defined LED colours
  */
enum mbColors
{
    //% block=red
    Red = 0xff0000,
    //% block=orange
    Orange = 0xffa500,
    //% block=yellow
    Yellow = 0xffff00,
    //% block=green
    Green = 0x00ff00,
    //% block=blue
    Blue = 0x0000ff,
    //% block=indigo
    Indigo = 0x4b0082,
    //% block=violet
    Violet = 0x8a2be2,
    //% block=purple
    Purple = 0xff00ff,
    //% block=white
    White = 0xffffff,
    //% block=black
    Black = 0x000000
}

/**
 * Custom blocks
 */
//% weight=50 color=#e7660b icon="\uf1b9"
namespace minibit
{
    let fireBand: fireled.Band;
    let _updateMode = mbMode.Auto;
    let _initEvents = true;
    let btDisabled = true;

// Initialise events on first use

    function initEvents(): void
    {
        if (_initEvents)
        {
            pins.setEvents(DigitalPin.P0, PinEventType.Edge);
            pins.setEvents(DigitalPin.P1, PinEventType.Edge);
            pins.setEvents(DigitalPin.P2, PinEventType.Edge);
            _initEvents = false;
        }
    }

// Block to enable Bluetooth and disable FireLeds.
    /**
      * Enable/Disable Bluetooth support by disabling/enabling FireLeds
      * @param enable enable or disable Blueetoth
    */
    //% blockId="mbEnableBluetooth"
    //% block="19 %enable|Bluetooth"
    export function mbEnableBluetooth(enable: mbBluetooth)
    {
        if (enable == mbBluetooth.btEnable)
            btDisabled = false;
        else
            btDisabled = true;
    }

// Motor Blocks

    // slow PWM frequency for slower speeds to improve torque
    // only one PWM frequency available for all pins
    function setPWM(speed: number): void
    {
        if (speed < 200)
            pins.analogSetPeriod(AnalogPin.P16, 60000);
        else if (speed < 300)
            pins.analogSetPeriod(AnalogPin.P16, 40000);
        else
            pins.analogSetPeriod(AnalogPin.P16, 30000);
    }

    /**
      * Move robot forward (or backward) at speed.
      * @param direction Move Forward or Reverse
      * @param speed speed of motor between 0 and 100. eg: 60
      */
    //% blockId="mbGo" block="go %direction|at speed %speed"
    //% speed.min=0 speed.max=100
    //% weight=100
    //% subcategory=Motors
    //% group=""
    export function go(direction: mbDirection, speed: number): void
    {
        move(mbMotor.Both, direction, speed);
    }

    /**
      * Move robot forward (or backward) at speed for milliseconds
      * @param direction Move Forward or Reverse
      * @param speed speed of motor between 0 and 100. eg: 60
      * @param milliseconds duration in milliseconds to drive forward for, then stop. eg: 400
      */
    //% blockId="mbGoms" block="go %direction|at speed %speed|for %milliseconds|(ms)"
    //% speed.min=0 speed.max=100
    //% weight=90
    //% subcategory=Motors
    //% group="Motors"
    export function goms(direction: mbDirection, speed: number, milliseconds: number): void
    {
        go(direction, speed);
        basic.pause(milliseconds);
        stop(mbStopMode.Coast);
    }

    /**
      * Move motors forward or reverse
      * @param motor motor to drive
      * @param direction select forwards or reverse
      * @param speed speed of motor between 0 and 100. eg: 60
      */
    //% blockId="mbMove" block="move %motor|motor(s) %direction|at speed %speed"
    //% weight=50
    //% speed.min=0 speed.max=100
    //% subcategory=Motors
    //% group="Motors"
    export function move(motor: mbMotor, direction: mbDirection, speed: number): void
    {
        let speed0 = 0;
        let speed1 = 0;
        speed = Math.max(Math.min(100, speed),0) * 10.23;
        setPWM(speed);
        if (direction == mbDirection.Forward)
        {
            speed0 = speed;
            speed1 = 0;
        }
        else // must be Reverse
        {
            speed0 = 0;
            speed1 = speed;
        }
        if ((motor == mbMotor.Left) || (motor == mbMotor.Both))
        {
            pins.analogWritePin(AnalogPin.P12, speed0);
            pins.analogWritePin(AnalogPin.P8, speed1);
        }

        if ((motor == mbMotor.Right) || (motor == mbMotor.Both))
        {
            pins.analogWritePin(AnalogPin.P16, speed0);
            pins.analogWritePin(AnalogPin.P14, speed1);
        }
    }

    /**
      * Stop robot by coasting slowly to a halt or braking
      * @param mode Brakes on or off
      */
    //% blockId="mbStop" block="stop with %mode"
    //% weight=80
    //% subcategory=Motors
    //% group="Motors"
    export function stop(mode: mbStopMode): void
    {
        let stopMode = 0;
        if (mode == mbStopMode.Brake)
            stopMode = 1;
        pins.digitalWritePin(DigitalPin.P16, stopMode);
        pins.digitalWritePin(DigitalPin.P14, stopMode);
        pins.digitalWritePin(DigitalPin.P8, stopMode);
        pins.digitalWritePin(DigitalPin.P12, stopMode);
    }

// Old Motor Blocks - kept for compatibility
    /**
      * Drive motor(s) forward or reverse.
      * @param motor motor to drive.
      * @param speed speed of motor (-1023 to 1023). eg: 600
      */
    //% blockId="minibit_motor" block="drive %motor|motor(s) at speed %speed"
    //% weight=50
    //% subcategory=Motors
    //% group="Old Blocks"
    export function motor(motor: mbMotor, speed: number): void
    {
        let speed0 = 0;
        let speed1 = 0;
        setPWM(Math.abs(speed));
        if (speed > 0)
        {
            speed0 = speed;
            speed1 = 0;
        }
        else
        {
            speed0 = 0;
            speed1 = 0 - speed;
        }
        if ((motor == mbMotor.Left) || (motor == mbMotor.Both))
        {
            pins.analogWritePin(AnalogPin.P12, speed0);
            pins.analogWritePin(AnalogPin.P8, speed1);
        }

        if ((motor == mbMotor.Right) || (motor == mbMotor.Both))
        {
            pins.analogWritePin(AnalogPin.P16, speed0);
            pins.analogWritePin(AnalogPin.P14, speed1);
        }
    }

    /**
      * Drive robot forward (or backward) at speed.
      * @param speed speed of motor between -1023 and 1023. eg: 600
      */
    //% blockId="minibit_drive" block="drive at speed %speed"
    //% speed.min=-1023 speed.max=1023
    //% weight=100
    //% subcategory=Motors
    //% group="Old Blocks"
    export function drive(speed: number): void
    {
        motor(mbMotor.Both, speed);
    }

    /**
      * Drive robot forward (or backward) at speed for milliseconds.
      * @param speed speed of motor between -1023 and 1023. eg: 600
      * @param milliseconds duration in milliseconds to drive forward for, then stop. eg: 400
      */
    //% blockId="minibit_drive_milliseconds" block="drive at speed %speed| for %milliseconds|(ms)"
    //% speed.min=-1023 speed.max=1023
    //% weight=70
    //% subcategory=Motors
    //% group="Old Blocks"
    export function driveMilliseconds(speed: number, milliseconds: number): void
    {
        drive(speed);
        basic.pause(milliseconds);
        stop(mbStopMode.Coast);
    }

    /**
      * Turn robot in direction at speed.
      * @param direction direction to turn.
      * @param speed speed of motor between 0 and 1023. eg: 600
      */
    //% blockId="minibit_spin" block="spin %direction|at speed %speed"
    //% speed.min=0 speed.max=1023
    //% weight=90
    //% subcategory=Motors
    //% group="Old Blocks"
    export function spin(direction: mbRobotDirection, speed: number): void
    {
        if (speed < 0)
            speed = 0;
        if (direction == mbRobotDirection.Left)
        {
            motor(mbMotor.Left, -speed);
            motor(mbMotor.Right, speed);
        }
        else if (direction == mbRobotDirection.Right)
        {
            motor(mbMotor.Left, speed);
            motor(mbMotor.Right, -speed);
        }
    }

    /**
      * Spin robot in direction at speed for milliseconds.
      * @param direction direction to spin
      * @param speed speed of motor between 0 and 1023. eg: 600
      * @param milliseconds duration in milliseconds to spin for, then stop. eg: 400
      */
    //% blockId="minibit_spin_milliseconds" block="spin %direction|at speed %speed| for %milliseconds|(ms)"
    //% speed.min=0 speed.max=1023
    //% weight=60
    //% subcategory=Motors
    //% group="Old Blocks"
    export function spinMilliseconds(direction: mbRobotDirection, speed: number, milliseconds: number): void
    {
        spin(direction, speed);
        basic.pause(milliseconds);
        stop(mbStopMode.Coast);
    }

// Sensors and Addons

    /**
    * Read distance from sonar module connected to accessory connector.
    * @param unit desired conversion unit
    */
    //% blockId="minibit_sonar" block="read sonar as %unit"
    //% weight=100
    //% subcategory=Sensors
    //% group="Sensors"
    export function sonar(unit: mbPingUnit): number
    {
        // send pulse
        let trig = DigitalPin.P15;
        let echo = DigitalPin.P15;
        let maxCmDistance = 500;
        let d=10;
        pins.setPull(trig, PinPullMode.PullNone);
        for (let x=0; x<10; x++)
        {
            pins.digitalWritePin(trig, 0);
            control.waitMicros(2);
            pins.digitalWritePin(trig, 1);
            control.waitMicros(10);
            pins.digitalWritePin(trig, 0);
            // read pulse
            d = pins.pulseIn(echo, PulseValue.High, maxCmDistance * 58);
            if (d>0)
                break;
        }
        switch (unit)
        {
            case mbPingUnit.Centimeters: return Math.round(d / 58);
            case mbPingUnit.Inches: return Math.round(d / 148);
            default: return d;
        }
    }

    /**
    * Read Line sensor value and return as True/False. True == black line
    * @param sensor selected line sensor
    */
    //% blockId="lineSensor" block="%sensor| line sensor"
    //% weight=90
    //% subcategory=Sensors
    //% group="Line Sensor"
    export function lineSensor(sensor: mbLineSensors): boolean
    {
        if (sensor == mbLineSensors.Left)
            return pins.digitalReadPin(DigitalPin.P0)===1;
        else if (sensor == mbLineSensors.Centre)
            return pins.digitalReadPin(DigitalPin.P1)===1;
        else
            return pins.digitalReadPin(DigitalPin.P2)===1;
    }

    /**
      * Runs when line sensor finds or loses the black line
      */
    //% weight=80
    //% blockId=bc_event block="on %sensor| line %event"
    //% subcategory=Sensors
    //% group="Line Sensor"
    export function onEvent(sensor: mbPins, event: mbEvents, handler: Action)
    {
        initEvents();
        control.onEvent(<number>sensor, <number>event, handler);
    }


// LED Blocks

    // create a FireLed band if not got one already. Default to brightness 40
    function fire(): fireled.Band
    {
        if (!fireBand)
        {
            fireBand = fireled.newBand(DigitalPin.P13, 4);
            fireBand.setBrightness(40);
        }
        return fireBand;
    }

    // update FireLedss if _updateMode set to Auto
    function updateLEDs(): void
    {
        if (_updateMode == mbMode.Auto)
            ledShow();
    }

    /**
      * Sets all LEDs to a given color (range 0-255 for r, g, b).
      * @param rgb RGB color of the LED
      */
    //% blockId="minibit_set_led_color" block="set all LEDs to %rgb=mb_colours"
    //% weight=100
    //% subcategory=LEDs
    export function setLedColor(rgb: number)
    {
        fire().setBand(rgb);
        updateLEDs();
    }

    /**
      * Clear all leds.
      */
    //% blockId="minibit_led_clear" block="clear all LEDs"
    //% weight=90
    //% subcategory=LEDs
    export function ledClear(): void
    {
        fire().clearBand();
        updateLEDs();
    }

    /**
     * Set single LED to a given color (range 0-255 for r, g, b).
     *
     * @param ledId position of the LED (0 to 11)
     * @param rgb RGB color of the LED
     */
    //% blockId="minibit_set_pixel_color" block="set LED at %ledId|to %rgb=mb_colours"
    //% weight=80
    //% subcategory=LEDs
    export function setPixelColor(ledId: number, rgb: number): void
    {
        fire().setPixel(ledId, rgb);
        updateLEDs();
    }

    /**
     * Set the brightness of the LEDs
     * @param brightness a measure of LED brightness in 0-255. eg: 40
     */
    //% blockId="minibit_led_brightness" block="set LED brightness %brightness"
    //% brightness.min=0 brightness.max=255
    //% weight=70
    //% subcategory=LEDs
    export function ledBrightness(brightness: number): void
    {
        fire().setBrightness(brightness);
        updateLEDs();
    }

    /**
      * Shows a rainbow pattern on all LEDs.
      */
    //% blockId="minibit_rainbow" block="set led rainbow"
    //% weight=60
    //% subcategory=LEDs
    export function ledRainbow(): void
    {
        fire().setRainbow();
        updateLEDs()
    }

    /**
      * Get numeric value of colour
      *
      * @param color Standard RGB Led Colours
      */
    //% blockId="mb_colours" block=%color
    //% weight=50
    //% subcategory=LEDs
    export function mbColours(color: mbColors): number
    {
        return color;
    }

    // Advanced blocks

    /**
      * Set LED update mode (Manual or Automatic)
      * @param updateMode setting automatic will show LED changes automatically
      */
    //% blockId="minibit_set_updateMode" block="set %updateMode|update mode"
    //% weight=100
    //% advanced=true
    export function setUpdateMode(updateMode: mbMode): void
    {
        _updateMode = updateMode;
    }

    /**
      * Show LED changes
      */
    //% blockId="led_show" block="show LED changes"
    //% weight=90
    //% advanced=true
    export function ledShow(): void
    {
        if (btDisabled)
            fire().updateBand();
    }

    /**
     * Rotate LEDs forward.
     */
    //% blockId="minibit_led_rotate" block="rotate LEDs"
    //% weight=80
    //% advanced=true
    export function ledRotate(): void
    {
        fire().rotateBand();
        updateLEDs()
    }

    /**
     * Shift LEDs forward and clear with zeros.
     */
    //% blockId="minibit_led_shift" block="shift LEDs"
    //% weight=70
    //% subcategory=Leds
    //% advanced=true
    export function ledShift(): void
    {
        fire().shiftBand();
        updateLEDs()
    }

    /**
      * Convert from RGB values to colour number
      *
      * @param red Red value of the LED (0 to 255)
      * @param green Green value of the LED (0 to 255)
      * @param blue Blue value of the LED (0 to 255)
      */
    //% blockId="bitbot_convertRGB" block="convert from red %red| green %green| blue %blue"
    //% weight=60
    //% advanced=true
    export function convertRGB(r: number, g: number, b: number): number
    {
        return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
    }

}
