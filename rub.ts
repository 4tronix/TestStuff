
/**
  * Update mode for LEDs
  * setting to Manual requires show LED changes blocks
  * setting to Auto will update the LEDs everytime they change
  */
enum ledMode
{
    Manual,
    Auto
}

// Servo motion speed
enum servoSpeed
{
    VerySlow,
    Slow,
    Medium,
    Fast,
    VeryFast
}

/**
 * Button events
 */
enum RubEvents {
    //% block="on"
    Down = DAL.MICROBIT_BUTTON_EVT_UP,
    //% block="off"
    Up = DAL.MICROBIT_BUTTON_EVT_DOWN
}

/**
 * Custom blocks
 */
//% weight=50 color=#e7660b icon="\uf021"
namespace rub
{
    let band: fireled.Band;
    let ledPin = DigitalPin.P2;
    let ledCount = 4;
    let updateMode = ledMode.Auto;
    let btEnabled = false;
    let svClosed = 70;
    let svOpen = 150;
    let svMoving = false;
    let svPos = 90;  // current position of servo in degrees. 90 is centre

    function clamp(value: number, min: number, max: number): number
    {
        return Math.max(Math.min(max, value), min);
    }

// Switch Handling Blocks

    //% shim=rub::init
    function init(): void {
        return;
    }

    /**
      * Registers event code
      */
    //% weight=100
    //% blockId=rubOnEvent block="on switch %event"
    //% subcategory=Switch
    export function onEvent(event: RubEvents, handler: Action)
    {
        init();
        control.onEvent(<number>DAL.MICROBIT_ID_IO_P0, <number>event, handler); // register handler
    }

    /**
      * check switch state
      */
    //% blockId="CheckSwitch" block="switch state"
    //% weight=90
    //% subcategory=Switch
    export function checkSwitch(): boolean
    {
	 return pins.digitalReadPin(DigitalPin.P0)==1;
    }

// Servo Blocks
    /**
      * Set Servo Position Limits
      * @param Closed Degrees when fully closed (0 to 180). eg: 70
      * @param Open Degrees when fully open (0 to 180). eg: 150
      */
    //% blockId="SetServoLimits" block="set 08 closed to%Closed|, open to%Open"
    //% weight=100
    //% Closed.min=0 Closed.max=180
    //% Open.min=0 Open.max=180
    //% subcategory=Servo
    export function setServoLimits(Closed: number, Open: number): void
    {
        svClosed = clamp(Closed,0,180);
        svOpen = clamp(Open,0,180);
    }

    /**
      * Position Servo
      * @param degrees Degrees to turn servo (0 to 180). eg: 90
      */
    //% blockId="SetServo" block="set servo to%degrees|degrees"
    //% weight=90
    //% degrees.min=0 degrees.max=180
    //% subcategory=Servo
    export function setServo(degrees: number): void
    {
        degrees = clamp(degrees, svClosed, svOpen);
        while (svMoving)
            basic.pause(5);
        pins.servoWritePin(AnalogPin.P1, degrees);
        svPos = degrees;
    }

    // Convert positon in degrees to microseconds
    function deg2ms(degrees: number): number
    {
        return 500 + (degrees*1000)/90;
    }

    /**
      * Move Servo at specified speed
      * @param degrees Degrees to turn servo (0 to 180). eg: 90
      * @param speed speed of moving (Very Slow to Fast)
      */
    //% blockId="MoveServo" block="move servo to%degrees|degrees at speed%speed"
    //% weight=80
    //% degrees.min=0 degrees.max=180
    //% speed.min=1 speed.max=100
    //% subcategory=Servo
    export function moveServo(degrees: number, speed: servoSpeed): void
    {
        degrees = clamp(degrees, svClosed, svOpen);
        let step = 1;
        let delay = 1;
        if (speed == servoSpeed.VeryFast)
            setServo(degrees);
        else
        {
            while (svMoving)
                basic.pause(5);
            switch (speed)
            {
                case servoSpeed.Fast: step=3; break;
                case servoSpeed.Medium: step=2; break;
                case servoSpeed.Slow: delay=3; break;
            }
            svMoving = true;
            if (degrees < svPos)
            {
                for (let pos = deg2ms(svPos); pos > deg2ms(degrees); pos -= step)
                {
                    pins.servoSetPulse(AnalogPin.P1, pos);
                    basic.pause(delay);
                }
            }
            else
            {
                for (let pos = deg2ms(svPos); pos < deg2ms(degrees); pos += step)
                {
                    pins.servoSetPulse(AnalogPin.P1, pos);
                    basic.pause(delay);
                }
            }
            svMoving = false;
        }
        svPos = degrees;
    }


// FireLed Blocks

    // create a FireLed band if not got one already. Default to brightness 40
    function fire(): fireled.Band
    {
        if (!band)
        {
            band = fireled.newBand(ledPin, ledCount);
            band.setBrightness(40);
        }
        return band;
    }

    // update FireLeds if updateMode set to Auto  
    function updateLEDs()
    {
        if (updateMode == ledMode.Auto)
            ledShow();
    }

    /**
      * Sets all LEDs to a given color (range 0-255 for r, g, b).
      * @param rgb RGB color of the LED
      */
    //% blockId="SetLedColor" block="set all LEDs to%rgb=FireColours"
    //% subcategory=Fireleds
    //% weight=100
    export function setLedColor(rgb: number)
    {
        fire().setBand(rgb);
        updateLEDs();
    }

    /**
      * Clear all leds.
      */
    //% blockId="LedClear" block="clear all LEDs"
    //% subcategory=Fireleds
    //% weight=90
    export function ledClear()
    {
        fire().clearBand();
        updateLEDs();
    }

    /**
     * Set single LED to a given color (range 0-255 for r, g, b).
     * @param ledId position of the LED (0 to 3)
     * @param rgb RGB color of the LED
     */
    //% blockId="SetPixelColor" block="set LED at%ledId|to%rgb=FireColours"
    //% subcategory=Fireleds
    //% weight=80
    export function setPixelColor(ledId: number, rgb: number)
    {
        fire().setPixel(ledId, rgb);
        updateLEDs();
    }

    /**
      * Shows a rainbow pattern on all LEDs.
      */
    //% blockId="LedRainbow" block="set LED rainbow"
    //% subcategory=Fireleds
    //% weight=70
    export function ledRainbow()
    {
        fire().setRainbow();
        updateLEDs()
    }

    /**
     * Shift LEDs forward and clear with zeros.
     */
    //% blockId="LedShift" block="shift LEDs"
    //% subcategory=Fireleds
    //% weight=60
    export function ledShift()
    {
        fire().shiftBand();
        updateLEDs()
    }

    /**
     * Rotate LEDs forward.
     */
    //% blockId="LedRotate" block="rotate LEDs"
    //% subcategory=Fireleds
    //% weight=70
    export function ledRotate()
    {
        fire().rotateBand();
        updateLEDs()
    }

// Advanced Blocks
    /**
      * Enable/Disable Bluetooth support by disabling/enabling FireLeds
      * @param enable enable or disable Blueetoth
    */
    //% blockId="EnableBluetooth"
    //% block="enable Bluetooth & disable FireLeds%enable"
    //% enable.shadow="toggleYesNo"
    //% weight=100
    //% advanced=true
    export function enableBluetooth(enable: boolean)
    {
        btEnabled = enable;
    }

    /**
     * Set the brightness of the FireLed band
     * @param brightness a measure of LED brightness in 0-255. eg: 40
     */
    //% blockId="LedBrightness" block="set LED brightness%brightness"
    //% brightness.min=0 brightness.max=255
    //% weight=90
    //% advanced=true
    export function ledBrightness(brightness: number)
    {
        fire().setBrightness(brightness);
        updateLEDs();
    }

    /**
      * Set LED update mode (Manual or Automatic)
      * @param mode setting automatic will show LED changes automatically
      */
    //% blockId="SetUpdateMode" block="set%mode|update mode"
    //% weight=80
    //% advanced=true
    export function setUpdateMode(mode: ledMode)
    {
        updateMode = mode;
    }

    /**
      * Show LED changes
      */
    //% blockId="LedShow" block="show LED changes"
    //% weight=70
    //% advanced=true
    export function ledShow(): void
    {
        if (! btEnabled)
            fire().updateBand();
    }

    /**
      * Get numeric value of colour
      * @param colour Standard RGB Led Colours eg: #ff0000
      */
    //% blockId="FireColours" block=%colour
    //% blockHidden=false
    //% weight=60
    //% advanced=true
    //% shim=TD_ID colorSecondary="#e7660b"
    //% colour.fieldEditor="colornumber"
    //% colour.fieldOptions.decompileLiterals=true
    //% colour.defl='#ff0000'
    //% colour.fieldOptions.colours='["#FF0000","#659900","#18E600","#80FF00","#00FF00","#FF8000","#D82600","#B24C00","#00FFC0","#00FF80","#FFC000","#FF0080","#FF00FF","#B09EFF","#00FFFF","#FFFF00","#8000FF","#0080FF","#0000FF","#FFFFFF","#FF8080","#80FF80","#40C0FF","#999999","#000000"]'
    //% colour.fieldOptions.columns=5
    //% colour.fieldOptions.className='rgbColorPicker'
    export function fireColours(colour: number): number
    {
        return colour;
    }

    /**
      * Convert from RGB values to colour number
      * @param red Red value of the LED (0 to 255)
      * @param green Green value of the LED (0 to 255)
      * @param blue Blue value of the LED (0 to 255)
      */
    //% blockId="ConvertRGB" block="convert from red%red|green%green|blue%blue"
    //% weight=50
    //% advanced=true
    export function convertRGB(r: number, g: number, b: number): number
    {
        return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
    }


}
