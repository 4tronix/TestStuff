/**
 * Pins used to generate events
 */
enum EBPins
{
    //% block="red"
    Red = DigitalPin.P12,
    //% block="green"
    Green = DigitalPin.P8,
    //% block="yellow"
    Yellow = DigitalPin.P14,
    //% block="blue"
    Blue = DigitalPin.P16
}

/**
 * Button events
 */
enum EBEvents
{
    //% block="down"
    Press = DAL.MICROBIT_BUTTON_EVT_UP,
    //% block="up"
    Release = DAL.MICROBIT_BUTTON_EVT_DOWN
}

/**
  * Enumeration of buttons
  */
enum EBButtons
{
    //% block="red"
    Red,
    //% block="green"
    Green,
    //% block="yellow"
    Yellow,
    //% block="blue"
    Blue
}


/**
  * Enumeration of mouth parts
  */
enum EBMouth
{
    //% block="upper"
    Upper,
    //% block="middle"
    Middle,
    //% block="lower"
   Lower
}


/**
  * Update mode for LEDs
  * setting to Manual requires show LED changes blocks
  * setting to Auto will update the LEDs everytime they change
  */
enum EBMode
{
    Manual,
    Auto
}

/**
  * Pre-Defined LED colours
  */
enum EBColors
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
 * Ping unit for Ultrasonic sensor. (Not on EggBit Ovoid)
 */
enum ebPingUnit
{
    //% block="cm"
    Centimeters,
    //% block="inches"
    Inches,
    //% block="μs"
    MicroSeconds
}


/**
 * Custom blocks
 */
//% weight=10 color=#e7660b icon="\uf11b"
namespace eggbit
{
    let band: fireled.Band;
    let ledPin = DigitalPin.P13;
    let ledCount = 9;
    let _updateMode = EBMode.Auto;
    let btEnabled = false;

    let _initEvents = true;

// General. Buttons, Ultrasonic, Mouth LEDs

    //% shim=eggbit::init
    function init(): void
    {
        return;
    }

    /**
      * Registers event code
      */
    //% weight=90
    //% blockId=ebOnEvent block="on 02 button%button|%event"
    //% subcategory=General
    export function onEvent(button: EBPins, event: EBEvents, handler: Action)
    {
        init();
        control.onEvent(<number>button, <number>event, handler); // register handler
    }

    /**
      * check button states
      * @param buttonID Button to check
      */
    //% blockId="ebCheckButton" block="button %buttonID|pressed"
    //% weight=100
    //% subcategory=General
    export function readButton(buttonID: EBButtons): boolean
    {
	switch (buttonID)
	{
            case EBButtons.Red: return pins.digitalReadPin(DigitalPin.P12)==1; break;
            case EBButtons.Green: return pins.digitalReadPin(DigitalPin.P8)==1; break;
            case EBButtons.Yellow: return pins.digitalReadPin(DigitalPin.P14)==1; break;
            case EBButtons.Blue: return pins.digitalReadPin(DigitalPin.P16)==1; break;
	    default: return false;
	}
    }

    /**
      * set mouth parts on/off
      * @param mouthPart Section of mouth to turn on/off
      * @param mode Select On or Off
      */
    //% blockId="ebSetMouth" block="button %buttonID|pressed"
    //% weight=100
    //% subcategory=General
    export function setMouth(mouthPart: EBMouth, mode: boolean)
    {
	switch (mouthPart)
	{
            case EBMouth.Upper: pins.digitalWritePin(DigitalPin.P0, mode?1:0); break;
            case EBMouth.Middle: pins.digitalWritePin(DigitalPin.P1, mode?1:0); break;
            case EBMouth.Lower: pins.digitalWritePin(DigitalPin.P2, mode?1:0); break;
	}
    }

    /**
    * Read distance from Ultrasonic (not EggBit Ovoid)
    * @param unit desired conversion unit
    */
    //% blockId="ebSonar" block="read sonar as %unit"
    //% weight=80
    //% subcategory=General
    export function sonar(unit: ebPingUnit): number
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
            case ebPingUnit.Centimeters: return Math.round(d / 58);
            case ebPingUnit.Inches: return Math.round(d / 148);
            default: return d;
        }
    }

// Fireled Helper Blocks

    // create a FireLed band if not got one already. Default to brightness 40
    // defaults to P13 and 50 LEDs if not specified
    function fire(): fireled.Band
    {
        if (!band)
        {
            band = fireled.newBand(ledPin, ledCount);
            band.setBrightness(40);
        }
        return band;
    }

    // update LEDs if _updateMode set to Auto
    function updateLEDs(): void
    {
        if (_updateMode == EBMode.Auto)
            ledShow();
    }

    /**
      * Sets all LEDs to a given color (range 0-255 for r, g, b).
      * @param rgb RGB color of the LED
      */
    //% blockId="bcSetLedColor" block="set all LEDs to%rgb=FireColours"
    //% subcategory=Leds
    //% weight=100
    export function setLedColor(rgb: number)
    {
        fire().setBand(rgb);
        updateLEDs();
    }

    /**
      * Clear all leds.
      */
    //% blockId="bcLedClear" block="clear all LEDs"
    //% subcategory=Leds
    //% weight=90
    export function ledClear()
    {
        fire().clearBand();
        updateLEDs();
    }

    /**
     * Set single LED to a given color (range 0-255 for r, g, b).
     * @param ledId position of the LED (0 to 5)
     * @param rgb RGB color of the LED
     */
    //% blockId="bcSetPixelColor" block="set LED at%ledId|to%rgb=FireColours"
    //% subcategory=Leds
    //% weight=80
    export function setPixelColor(ledId: number, rgb: number)
    {
        fire().setPixel(ledId, rgb);
        updateLEDs();
    }

    /**
      * Shows a rainbow pattern on all LEDs.
      */
    //% blockId="ebLedRainbow" block="set LED rainbow"
    //% subcategory=Leds
    //% weight=70
    export function ledRainbow()
    {
        fire().setRainbow();
        updateLEDs()
    }

    /**
     * Shift LEDs forward and clear with zeros.
     */
    //% blockId="bcLedShift" block="shift LEDs"
    //% subcategory=Leds
    //% weight=60
    export function ledShift()
    {
        fire().shiftBand();
        updateLEDs()
    }

    /**
     * Rotate LEDs forward.
     */
    //% blockId="bcLedRotate" block="rotate LEDs"
    //% subcategory=Leds
    //% weight=50
    export function ledRotate()
    {
        fire().rotateBand();
        updateLEDs()
    }

    // Advanced Fireled blocks

    /**
     * Set the brightness of the FireLed band
     * @param brightness a measure of LED brightness in 0-255. eg: 40
     */
    //% blockId="ebLedBrightness" block="set LED brightness%brightness"
    //% brightness.min=0 brightness.max=255
    //% weight=100
    //% advanced=true
    export function ledBrightness(brightness: number)
    {
        fire().setBrightness(brightness);
        updateLEDs();
    }

    /**
      * Set LED update mode (Manual or Automatic)
      * @param updateMode setting automatic will show LED changes automatically
      */
    //% blockId="ebSetUpdateMode" block="set %updateMode|update mode"
    //% weight=90
    //% advanced=true
    export function setUpdateMode(updateMode: EBMode): void
    {
        _updateMode = updateMode;
    }

    /**
      * Show LED changes
      */
    //% blockId="ebLedShow" block="show LED changes"
    //% weight=80
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
    //% advanced=true
    //% blockHidden=false
    //% weight=70
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
    //% blockId="ebConvertRGB" block="convert from red%red|green%green|blue%blue"
    //% weight=60
    //% advanced=true
    export function convertRGB(r: number, g: number, b: number): number
    {
        return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
    }


}
