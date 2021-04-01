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
    Press = DAL.MICROBIT_PIN_EVT_RISE,
    //% block="up"
    Release = DAL.MICROBIT_PIN_EVT_FALL
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
  * Mouth shapes
  */
enum EBExpression
{
    Neutral,
    Smile,
    OpenSmile,
    Sad,
    OpenSad,
    Surprise,
    AllOff,
    AllOn
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

    let larsson: number;
    let scandir: number;
    let _scanning = false;
    let scanColour1 = 0xff0000;
    let scanColour2 = 0x0f0000;
    let scanColour3 = 0x030000;

    // bar graph paarameters. Default range 0-100 in Red
    let graphLow = 0;
    let graphHigh = 100;
    let graphCol1 = 0xff0000;
    let graphCol2 = 0xff0000;


// General. Buttons, Ultrasonic, Mouth LEDs

    function initEvents(): void
    {
        if (_initEvents)
        {
            pins.setEvents(DigitalPin.P16, PinEventType.Edge);
            pins.setEvents(DigitalPin.P14, PinEventType.Edge);
            pins.setEvents(DigitalPin.P12, PinEventType.Edge);
            pins.setEvents(DigitalPin.P8, PinEventType.Edge);
            _initEvents = false;
        }
    }

    /**
      * Registers event code
      */
    //% weight=100
    //% blockId=ebOnEvent block="on button%button|%event"
    //% subcategory="Input/Output"
    export function onEvent(button: EBPins, event: EBEvents, handler: Action)
    {
        initEvents();
        control.onEvent(<number>button, <number>event, handler); // register handler
    }

    /**
      * check button states
      * @param buttonID Button to check
      */
    //% blockId="ebCheckButton" block="button%buttonID|pressed"
    //% weight=90
    //% subcategory="Input/Output"
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

    function setUpper(mode: number): void
    {
        pins.digitalWritePin(DigitalPin.P0, mode);
    }

    function setMiddle(mode: number): void
    {
        pins.digitalWritePin(DigitalPin.P1, mode);
    }

    function setLower(mode: number): void
    {
        pins.digitalWritePin(DigitalPin.P2, mode);
    }

    /**
      * Set expression (not EggBit Ovoid)
      * @param shape Expression to select
      */
    //% blockId="ebSetExpression" block="expression%shape"
    //% weight=80
    //% subcategory="Input/Output"
    //% mode.shadow="toggleOnOff"
    export function setExpression(shape: EBExpression)
    {
	switch (shape)
        {
            case EBExpression.Neutral: setLower(0); setMiddle(1); setUpper(0); break;
            case EBExpression.Smile: setLower(1); setMiddle(0); setUpper(0); break;
            case EBExpression.OpenSmile: setLower(1); setMiddle(1); setUpper(0); break;
            case EBExpression.Sad: setLower(0); setMiddle(0); setUpper(1); break;
            case EBExpression.OpenSad: setLower(0); setMiddle(1); setUpper(1); break;
            case EBExpression.Surprise: setLower(1); setMiddle(0); setUpper(1); break;
            case EBExpression.AllOff: setLower(0); setMiddle(0); setUpper(0); break;
            case EBExpression.AllOn: setLower(1); setMiddle(1); setUpper(1); break;
        }
    }

    /**
      * Set mouth parts on/off (not EggBit Ovoid)
      * @param mouthPart Section of mouth to turn on/off
      * @param mode Select On or Off
      */
    //% blockId="ebSetMouth" block="mouth%mouthPart|%mode"
    //% weight=70
    //% subcategory="Input/Output"
    //% mode.shadow="toggleOnOff"
    export function setMouth(mouthPart: EBMouth, mode: boolean)
    {
	switch (mouthPart)
	{
            case EBMouth.Upper: setUpper(mode?1:0); break;
            case EBMouth.Middle: setMiddle(mode?1:0); break;
            case EBMouth.Lower: setLower(mode?1:0); break;
	}
    }

    /**
    * Read distance from Ultrasonic (not EggBit Ovoid)
    * @param unit desired conversion unit
    */
    //% blockId="ebSonar" block="read sonar as %unit"
    //% weight=60
    //% subcategory="Input/Output"
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
    //% blockId="bcSetLedColor" block="set all FireLEDs to%rgb=FireColours"
    //% subcategory=FireLeds
    //% weight=100
    export function setLedColor(rgb: number)
    {
        fire().setBand(rgb);
        updateLEDs();
    }

    /**
      * Clear all leds.
      */
    //% blockId="bcLedClear" block="clear all FireLEDs"
    //% subcategory=FireLeds
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
    //% blockId="bcSetPixelColor" block="set FireLED at%ledId|to%rgb=FireColours"
    //% subcategory=FireLeds
    //% weight=80
    export function setPixelColor(ledId: number, rgb: number)
    {
        fire().setPixel(ledId, rgb);
        updateLEDs();
    }

    /**
      * Shows a rainbow pattern on all LEDs.
      */
    //% blockId="ebLedRainbow" block="set FireLED rainbow"
    //% subcategory=FireLeds
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
    //% subcategory=FireLeds
    //% weight=60
    export function ledShift()
    {
        fire().shiftBand();
        updateLEDs()
    }

    /**
     * Rotate LEDs forward.
     */
    //% blockId="bcLedRotate" block="rotate FireLEDs"
    //% subcategory=FireLeds
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
    //% blockId="ebLedBrightness" block="set FireLED brightness%brightness"
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
      * @param updateMode setting automatic will show FireLED changes automatically
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
    //% blockId="ebLedShow" block="show FireLED changes"
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

    /**
      * Start Scanner
      * @param colour the colour to use for scanning
      * @param delay time in ms between scan steps, eg: 100,50,200,500
      */
    //% blockId="StartScanner" block="start scan%colour=FireColours|with%delay|ms"
    //% subcategory=FireLeds
    //% delay.min=1 delay.max=10000
    //% weight=50
    export function startScanner(colour: number, delay: number): void
    {
        scanColour1 = colour;
        scanColour2 = reduce(scanColour1, 8);
        scanColour3 = reduce(scanColour2, 4);
        if(_scanning == false)
        {
            _scanning = true;
            control.inBackground(() =>
            {
                while (_scanning)
                {                                
                    ledScan();
                    ledShow();
                    basic.pause(delay);
                }
            })
        }
    }

    /**
      * Reduce colour RGB separately by divisor
      */
    function reduce(colour: number, reducer: number): number
    {
        let red = ((colour & 0xff0000) / reducer) & 0xff0000;
        let green = ((colour & 0x00ff00) / reducer) & 0x00ff00;
        let blue = ((colour & 0x0000ff) / reducer) & 0x0000ff;
        return red + green + blue;
    }

    /**
      * Stop Scanner
      */
    //% blockId="StopScanner" block="stop scanner"
    //% subcategory=FireLeds
    //% weight=40
    export function stopScanner(): void
    {
        _scanning = false;
    }

    /**
     * Use all LEDs as Larsson Scanner. Each call moves the scan by one pixel
     */
    //% subcategory=FireLeds
    //% blockId="LedScan" block="scan all FireLeds"
    //% weight=35
    //% deprecated=true
    export function ledScan(): void
    {
        if (!larsson)
        {
            larsson = 1;
            scandir = 1;
        }
        larsson += scandir;
        if (larsson >= (ledCount - 1))
            scandir = -1;
        else if (larsson <= 0)
            scandir = 1;
        for (let x = 0; x < ledCount; x++)
        {
            if ((x == (larsson - 2)) || (x == (larsson + 2)))
                setPixelColor(x, scanColour3);
            else if ((x == (larsson - 1)) || (x == (larsson + 1)))
                setPixelColor(x, scanColour2);
            else if (x == larsson)
                setPixelColor(x, scanColour1);
            else
                setPixelColor(x, 0);
        }
    }

    /**
      * Set Bargraph Parameters
      * @param lowest Lowest value to graph (single LED at colour1)
      * @param highest highest value to graph (all LEDs lit, highest at colour2)
      * @param colour1 the colour for lowest value
      * @param colour2 the colour for highest value
      */
    //% blockId="SetBargraph" block="set graph%lowest|to%highest|from%colour1=FireColours|to%colour2=FireColours"
    //% subcategory=FireLeds
    //% weight=30
    export function setBargraph(lowest: number, highest: number, colour1: number, colour2: number): void
    {
        graphLow = lowest;
        graphHigh = highest;
        graphCol1 = colour1;
        graphCol2 = colour2;
    }

    /**
      * Draw bargraph using value and previosuly set parameters
      * @param value value to draw in graph
      */
    //% blockId="DrawBargraph" block="draw 12 bar graph with%value"
    //% subcategory=FireLeds
    //% weight=20
    export function drawBargraph(value: number): void
    {
        let deltaVal = (graphHigh - graphLow) / ledCount;
        let deltaRed = (((graphCol2-graphCol1) & 0xff0000) / ledCount) & 0xff0000;
        let deltaGreen = (((graphCol2-graphCol1) & 0x00ff00) / ledCount) & 0x00ff00;
        let deltaBlue = (((graphCol2-graphCol1) & 0x0000ff) / ledCount) & 0x0000ff;
        let pRed = graphCol2 & 0xff0000;
        let pGreen = graphCol2 & 0x00ff00;
        let pBlue = graphCol2 & 0x0000ff;
        for (let i=0; i < ledCount; i++)
        {
            return red + green + blue;
            if (value <= (graphHigh - deltaVal * i))
                fire().setPixel(ledCount-i-1, pRed+pGreen+pBlue);
            else
                fire().setPixel(ledCount-i-1, 0);
            pRed = (pRed-deltaRed) & 0xff0000;
            pGreen = (pGreen-deltaGreen) & 0x00ff00;
            pBlue = (pBlue-deltaBlue) & 0x0000ff;
        }
        updateLEDs();
    }

}
