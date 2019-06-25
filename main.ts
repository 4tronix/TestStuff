/**
  * Enumeration of motors
  */
enum BCMotor
{
    //% block="FrontLeft"
    FL,
    //% block="FrontRight"
    FR,
    //% block="RearRight"
    RR,
    //% block="RearLeft"
    RL
}

/**
  * Enumeration of directions
  */
enum BCDirection
{
    //% block="left"
    Left,
    //% block="right"
    Right,
    //% block="forward"
    Forward,
    //% block="reverse"
    Reverse
}

/**
 * Ping unit for sensor
 */
enum BCPingUnit
{
    //% block="cm"
    Centimeters,
    //% block="inches"
    Inches,
    //% block="μs"
    MicroSeconds
}

/**
 * Pre-Defined pixel colours
 */
enum BCColors
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
  * Update mode for LEDs
  * setting to Manual requires show LED changes blocks
  * setting to Auto will update the LEDs everytime they change
  */
enum BCMode
{
    Manual,
    Auto
}

/**
 * Custom blocks
 */

//% weight=10 color=#e7660b icon="\uf1cd"
namespace BitCopter
{
    let PCA = 0x40;	// i2c address of 4tronix BitCopter PWM controller
    let initI2C = false;
    let PWM0 = 0x06; // first address for start byte low on PWM channel 0
    let leds: neopixel.Strip;
    let _updateMode = BCMode.Auto;

    // Helper functions

    // initialise the PWM driver
    function initPCA(): void
    {

        let i2cData = pins.createBuffer(2);
        initI2C = true;

        i2cData[0] = 0;		// Mode 1 register
        i2cData[1] = 0x10;	// put to sleep
        pins.i2cWriteBuffer(PCA, i2cData, false);

        i2cData[0] = 0xFE;	// Prescale register
        i2cData[1] = 101;	// set to 60 Hz
        pins.i2cWriteBuffer(PCA, i2cData, false);

        i2cData[0] = 0;		// Mode 1 register
        i2cData[1] = 0x81;	// Wake up
        pins.i2cWriteBuffer(PCA, i2cData, false);

        for (let pwm=0; pwm<4; pwm++)
        {
            i2cData[0] = PWM0 + pwm*4 + 0;	// PWM register
            i2cData[1] = 0x00;			// low byte start
            pins.i2cWriteBuffer(PCA, i2cData, false);

            i2cData[0] = PWM0 + pwm*4 + 1;	// PWM register
            i2cData[1] = 0x00;			// high byte start
            pins.i2cWriteBuffer(PCA, i2cData, false);

            i2cData[0] = PWM0 + pwm*4 + 2;	// PWM register
            i2cData[1] = 0x00;			// low byte stop
            pins.i2cWriteBuffer(PCA, i2cData, false);

            i2cData[0] = PWM0 + pwm*4 + 3;	// PWM register
            i2cData[1] = 0x00;			// high byte stop
            pins.i2cWriteBuffer(PCA, i2cData, false);
        }
    }

    /**
      * Turn selected motor at speed.
      * @param motor motor to drive
      * @param speed speed of motor between 0 and 1023. eg: 600
      */
    //% blockId="rotate_motor" block="rotate 27 %motor| motor at speed %speed"
    //% weight=110
    export function rotate(motor: BCMotor, speed: number): void
    {
        turnMotor(motorNum(motor), speed);
    }

    /**
      * Get numeric value of motor
      */
    function motorNum(motor: BCMotor): number
    {
        return motor;
    }

    function turnMotor(motor: number, speed: number): void
    {
        if (initI2C == false)
        {
            initPCA();
        }
        // two bytes need setting for start and stop positions of the PWM period
        // PWM drivers start at PWM0 (0x06) and are then consecutive blocks of 4 bytes
        // the start position (always 0x00) is set during init for all

        let i2cData = pins.createBuffer(2);
        let start = 0;
        let stop = speed * 4;

        i2cData[0] = PWM0 + motor*4 + 2;	// Servo register
        i2cData[1] = (stop & 0xff);		// low byte stop
        pins.i2cWriteBuffer(PCA, i2cData, false);

        i2cData[0] = PWM0 + motor*4 + 3;	// Servo register
        i2cData[1] = (stop >> 8);		// high byte stop
        pins.i2cWriteBuffer(PCA, i2cData, false);
    }

    /**
    * Read height from sonar module
    *
    * @param unit desired conversion unit
    */
    //% subcategory=Sensors
    //% group=Sensors
    //% blockId="height_sonar" block="read sonar as %unit"
    //% weight=90
    export function sonar(unit: BCPingUnit): number
    {
        // send pulse
        let trig = DigitalPin.P15;
        let echo = trig;
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
            case BCPingUnit.Centimeters: return d / 58;
            case BCPingUnit.Inches: return d / 148;
            default: return d;
        }
    }

    function neo(): neopixel.Strip
    {
        if (!leds)
        {
            leds = neopixel.create(DigitalPin.P16, 4, NeoPixelMode.RGB);
            leds.setBrightness(40);
        }
        return leds;
    }

    // update LEDs if _updateMode set to Auto
    function updateLEDs(): void
    {
        if (_updateMode == BCMode.Auto)
            neo().show();
    }

    /**
      * Set LED update mode (Manual or Automatic)
      * @param updateMode setting automatic will show LED changes automatically
      */
    //% blockId="set_updateMode" block="set %updateMode|update mode"
    //% weight=65
    //% advanced=true
    export function setUpdateMode(updateMode: BCMode): void
    {
        _updateMode = updateMode;
    }

    /**
      * Sets all pixels to a given colour
      *
      * @param rgb RGB colour of the pixel
      */
    //% subcategory=leds
    //% group=leds
    //% blockId="set_color" block="set all pixels to %rgb=bc_colours"
    //% weight=90
    export function setColor(rgb: number): void
    {
        neo().showColor(rgb);
        updateLEDs();
    }

    /**
     * Set a pixel to a given colour (using colour names).
     *
     * @param ID location of the pixel in the cube from 0
     * @param rgb RGB color of the LED
     */
    //% subcategory=leds
    //% group=leds
    //% blockId="set_pixel_color" block="set pixel color at %ID|to %rgb=bc_colours"
    //% weight=85
    export function setPixel(ID: number, rgb: number): void
    {
        neo().setPixelColor(ID, rgb);
        updateLEDs();
    }

    /**
     * Convert from RGB values to colour number
     *
     * @param red Red value of the LED 0:255
     * @param green Green value of the LED 0:255
     * @param blue Blue value of the LED 0:255
     */
    //% subcategory=leds
    //% group=leds
    //% blockId="convertRGB" block="convert from red %red| green %green| blue %bblue"
    //% weight=55
    export function convertRGB(r: number, g: number, b: number): number
    {
        return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
    }

    /**
      * Show pixels
      */
    //% subcategory=leds
    //% group=leds
    //% blockId="leds_show" block="show Led changes"
    //% weight=95
    export function ledsShow(): void
    {
        neo().show();
    }

    /**
      * Clear leds.
      */
    //% subcategory=leds
    //% group=leds
    //% blockId="leds_clear" block="clear all pixels"
    //% weight=80
    export function ledsClear(): void
    {
        neo().clear();
        updateLEDs();
    }

    /**
     * Shift LEDs forward and clear with zeros.
     */
    //% subcategory=leds
    //% group=leds
    //% blockId="leds_shift" block="shift pixels"
    //% weight=65
    export function ledsShift(): void
    {
        neo().shift(1);
        updateLEDs();
    }

    /**
     * Rotate LEDs forward.
     */
    //% subcategory=leds
    //% group=leds
    //% blockId="leds_rotate" block="rotate pixels"
    //% weight=70
    export function ledsRotate(): void
    {
        neo().rotate(1);
        updateLEDs();
   }

    /**
     * Set the brightness of the Leds. Note this only applies to future writes to the strip.
     * @param brightness a measure of LED brightness in 0-255. eg: 40
     */
    //% subcategory=leds
    //% group=leds
    //% blockId="leds_brightness" block="set Led brightness %brightness"
    //% brightness.min=0 brightness.max=255
    //% weight=92
    export function ledsBrightness(brightness: number): void
    {
        neo().setBrightness(brightness);
        updateLEDs();
    }

    /**
      * Gets numeric value of colour
      *
      * @param color Standard RGB Led Colours
      */
    //% subcategory=leds
    //% group=leds
    //% blockId="bc_colours" block=%color
    //% weight=60
    export function BCColours(color: BCColors): number
    {
        return color;
    }


}