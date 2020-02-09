
/**
  * Enumeration of motors.
  */
enum DBMotor
{
    //% block="motor 1"
    M1,
    //% block="motor 2"
    M2,
    //% block="both"
    Both
}

/**
  * Enumeration of directions.
  */
enum DBRobotDirection
{
    //% block="left"
    Left,
    //% block="right"
    Right
}

/**
  * Stop modes. Coast or Brake
  */
enum DBStopMode
{
    //% block="no brake"
    Coast,
    //% block="brake"
    Brake
}

/**
  * Pre-Defined LED colours
  */
enum DBColors
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
//% weight=50 color=#e7660b icon="\uf0f9"
namespace DriveBit
{
    let fireBand: fireled.Band;
    let _flashing = false;

// Motor Blocks

    // slow PWM frequency for slower speeds to improve torque
    // only one PWM frequency available for all pins
    function setPWM(speed: number): void
    {
        if (speed < 200)
            pins.analogSetPeriod(AnalogPin.P12, 60000);
        else if (speed < 300)
            pins.analogSetPeriod(AnalogPin.P12, 40000);
        else
            pins.analogSetPeriod(AnalogPin.P12, 30000);
    }

    /**
      * Drive motor(s) forward or reverse.
      * @param motor motor to drive.
      * @param speed speed of motor (-1023 to 1023). eg: 600
      */
    //% blockId="db_motor" block="drive 04 %motor|motor(s) at speed %speed"
    //% weight=50
    //% subcategory=Motors
    export function motor(motor: DBMotor, speed: number): void
    {
        let reverse = 0;
        if (speed < 0)
        {
            reverse = 1;
            speed = -speed;
        }
        setPWM(speed);
        if ((motor == DBMotor.M1) || (motor == DBMotor.Both))
        {
            if (reverse == 0)
            {
                pins.analogWritePin(AnalogPin.P12, speed);
                pins.analogWritePin(AnalogPin.P13, 0);
            }
            else
            {
                pins.analogWritePin(AnalogPin.P12, 0);
                pins.analogWritePin(AnalogPin.P13, speed);
            }
        }
        if ((motor == DBMotor.M2) || (motor == DBMotor.Both))
        {
            if (reverse == 0)
            {
                pins.analogWritePin(AnalogPin.P14, speed);
                pins.analogWritePin(AnalogPin.P15, 0);
            }
            else
            {
                pins.analogWritePin(AnalogPin.P14, 0);
                pins.analogWritePin(AnalogPin.P15, speed);
            }
        }
    }

    /**
      * Stop robot by coasting slowly to a halt or braking
      * @param mode Brakes on or off
      */
    //% blockId="db_stop" block="stop with %mode"
    //% weight=80
    //% subcategory=Motors
    export function stop(mode: DBStopMode): void
    {
	// clear all analog PWM daemons
        pins.analogWritePin(AnalogPin.P12, 0);
        pins.analogWritePin(AnalogPin.P13, 0);
        pins.analogWritePin(AnalogPin.P14, 0);
        pins.analogWritePin(AnalogPin.P15, 0);
        if (mode == DBStopMode.Brake)
        {
            pins.digitalWritePin(DigitalPin.P12, 1);
            pins.digitalWritePin(DigitalPin.P13, 1);
            pins.digitalWritePin(DigitalPin.P14, 1);
            pins.digitalWritePin(DigitalPin.P15, 1);
        }
    }

    /**
      * Drive robot forward (or backward) at speed.
      * @param speed speed of motor between -1023 and 1023. eg: 600
      */
    //% blockId="db_drive" block="drive at speed %speed"
    //% speed.min=-1023 speed.max=1023
    //% weight=100
    //% subcategory=Motors
    export function drive(speed: number): void
    {
        motor(DBMotor.Both, speed);
    }

    /**
      * Drive robot forward (or backward) at speed for milliseconds.
      * @param speed speed of motor between -1023 and 1023. eg: 600
      * @param milliseconds duration in milliseconds to drive forward for, then stop. eg: 400
      */
    //% blockId="db_drive_milliseconds" block="drive at speed %speed| for %milliseconds|(ms)"
    //% speed.min=-1023 speed.max=1023
    //% weight=70
    //% subcategory=Motors
    export function driveMilliseconds(speed: number, milliseconds: number): void
    {
        drive(speed);
        basic.pause(milliseconds);
        stop(DBStopMode.Coast);
    }

    /**
      * Turn robot in direction at speed.
      * @param direction direction to turn.
      * @param speed speed of motor between 0 and 1023. eg: 600
      */
    //% blockId="db_spin" block="spin %direction|at speed %speed"
    //% speed.min=0 speed.max=1023
    //% weight=90
    //% subcategory=Motors
    export function spin(direction: DBRobotDirection, speed: number): void
    {
        if (speed < 0)
            speed = 0;
        if (direction == DBRobotDirection.Left)
        {
            motor(DBMotor.M1, -speed);
            motor(DBMotor.M2, speed);
        }
        else if (direction == DBRobotDirection.Right)
        {
            motor(DBMotor.M1, speed);
            motor(DBMotor.M2, -speed);
        }
    }

    /**
      * Spin robot in direction at speed for milliseconds.
      * @param direction direction to spin
      * @param speed speed of motor between 0 and 1023. eg: 600
      * @param milliseconds duration in milliseconds to spin for, then stop. eg: 400
      */
    //% blockId="db_spin_milliseconds" block="spin %direction|at speed %speed| for %milliseconds|(ms)"
    //% speed.min=0 speed.max=1023
    //% weight=60
    //% subcategory=Motors
    export function spinMilliseconds(direction: DBRobotDirection, speed: number, milliseconds: number): void
    {
        spin(direction, speed);
        basic.pause(milliseconds);
        stop(DBStopMode.Coast);
    }


// FireLed Status Blocks

    // create a FireLed band if not got one already. Default to brightness 40
    function fire(): fireled.Band
    {
        if (!fireBand)
        {
            fireBand = fireled.newBand(DigitalPin.P16, 1);
            fireBand.setBrightness(40);
        }
        return fireBand;
    }

    // Always update status LED
    function updateLEDs(): void
    {
        fire().updateBand();
    }

    /**
      * Sets the status LED to a given color (range 0-255 for r, g, b).
      * @param rgb colour of the LED
      */
    //% blockId="db_set_led_color" block="set LED to %rgb=db_colours"
    //% weight=100
    //% subcategory=FireLed
    export function setLedColor(rgb: number)
    {
        stopFlash();
        setLedColorRaw(rgb);
    }

    function setLedColorRaw(rgb: number)
    {
        fire().setBand(rgb);
        updateLEDs();
    }

    /**
      * Clear LED
      */
    //% blockId="db_led_clear" block="clear LED"
    //% weight=70
    //% subcategory=FireLed
    export function ledClear(): void
    {
        stopFlash();
        ledClearRaw();
    }

    function ledClearRaw(): void
    {
        fire().clearBand();
        updateLEDs();
    }

    /**
     * Set the brightness of the LED
     * @param brightness a measure of LED brightness in 0-255. eg: 40
     */
    //% blockId="db_led_brightness" block="set LED brightness %brightness"
    //% brightness.min=0 brightness.max=255
    //% weight=50
    //% subcategory=FireLed
    export function ledBrightness(brightness: number): void
    {
        fire().setBrightness(brightness);
        updateLEDs();
    }

    /**
      * Get numeric value of colour
      * @param color Standard RGB Led Colours eg: #ff0000
      */
    //% blockId="db_colours" block=%color
    //% blockHidden=false
    //% weight=60
    //% subcategory=FireLed
    //% blockGap=8
    //% shim=TD_ID colorSecondary="#e7660b"
    //% color.fieldEditor="colornumber"
    //% color.fieldOptions.decompileLiterals=true
    //% color.defl='#ff0000'
    //% color.fieldOptions.colours='["#FF0000","#D82600","#8B7300","#18E600","#007E81","#B24C00","#659900","#00FF00","#0057A7","#1B00E3","#3FC000","#00CA34","#0031CD","#4200BD","#8E0070","#00A45A","#0000FF","#680096","#B50049","#DB0023","#FF8080","#80FF80","#40C0FF","#FFFFFF","#000000"]'
    //% color.fieldOptions.columns=5
    //% color.fieldOptions.className='rgbColorPicker'
    export function dbColours(color: number): number
    {
        return color;
    }

    /**
      * Convert from RGB values to colour number
      *
      * @param red Red value of the LED (0 to 255)
      * @param green Green value of the LED (0 to 255)
      * @param blue Blue value of the LED (0 to 255)
      */
    //% blockId="db_convertRGB" block="convert from red %red| green %green| blue %blue"
    //% weight=40
    //% subcategory=FireLed
    export function convertRGB(r: number, g: number, b: number): number
    {
        return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
    }

    /**
      * Start Flashing
      * @param color the colour to flash
      * @param delay time in ms for each flash, eg: 100,50,200,500
      */
    //% blockId="startFlash" block="start flash %color=val_colours| at %delay|(ms)"
    //% subcategory=FireLed
    //% delay.min=1 delay.max=10000
    //% weight=90
    export function startFlash(color: number, delay: number): void
    {
        if(_flashing == false)
        {
            _flashing = true;
            control.inBackground(() =>
            {
                while (_flashing)
                {                                
                    setLedColorRaw(color);
                    basic.pause(delay);
                    if (! _flashing)
                        break;
                    ledClearRaw();
                    basic.pause(delay);
                }
            })
        }
    }

    /**
      * Stop Flashing
      */
    //% block
    //% subcategory=FireLed
    //% weight=80
    export function stopFlash(): void
    {
        _flashing = false;
    }


}
