
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

enum LatLong
{
    Latitude,
    Longitude
}

/**
 * Custom blocks
 */
//% weight=50 color=#e7660b icon="\uf021"
//% groups='["Bluetooth","Basic","Advanced"]'
namespace orbit
{
    let band: fireled.Band;
    let ledPin = DigitalPin.P1;
    let ledCount = 256;
    let updateMode = ledMode.Auto;
    let btEnabled = false;

    function clamp(value: number, min: number, max: number): number
    {
        return Math.max(Math.min(max, value), min);
    }

// Block to enable Bluetooth and disable FireLeds.
    /**
      * Enable/Disable Bluetooth support by disabling/enabling FireLeds
      * @param enable enable or disable Blueetoth
    */
    //% blockId="EnableBluetooth"
    //% block="enable 03 Bluetooth & disable FireLeds%enable"
    //% enable.shadow="toggleYesNo"
    //% weight=100
    //% blockGap=8
    export function enableBluetooth(enable: boolean)
    {
        btEnabled = enable;
    }

// Generic FireLed Blocks

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
    //% subcategory=Generic
    //% weight=80
    //% blockGap=8
    export function setLedColor(rgb: number)
    {
        fire().setBand(rgb);
        updateLEDs();
    }

    /**
      * Clear all leds.
      */
    //% blockId="LedClear" block="clear all LEDs"
    //% subcategory=Generic
    //% weight=70
    //% blockGap=8
    export function ledClear()
    {
        fire().clearBand();
        updateLEDs();
    }

    /**
     * Set single LED to a given color (range 0-255 for r, g, b).
     * @param ledId position of the LED (0 to 11)
     * @param rgb RGB color of the LED
     */
    //% blockId="SetPixelColor" block="set LED at%ledId|to%rgb=FireColours"
    //% subcategory=SingleString
    //% weight=60
    //% blockGap=8
    export function setPixelColor(ledId: number, rgb: number)
    {
        fire().setPixel(ledId, rgb);
        updateLEDs();
    }

    /**
      * Shows a rainbow pattern on all LEDs.
      */
    //% blockId="LedRainbow" block="set LED rainbow"
    //% subcategory=SingleString
    //% weight=50
    //% blockGap=8
    export function ledRainbow()
    {
        fire().setRainbow();
        updateLEDs()
    }

    /**
     * Shift LEDs forward and clear with zeros.
     */
    //% blockId="LedShift" block="shift LEDs"
    //% subcategory=SingleString
    //% weight=40
    //% blockGap=8
    export function ledShift()
    {
        fire().shiftBand();
        updateLEDs()
    }

    /**
     * Rotate LEDs forward.
     */
    //% blockId="LedRotate" block="rotate LEDs"
    //% subcategory=SingleString
    //% weight=30
    //% blockGap=8
    export function ledRotate()
    {
        fire().rotateBand();
        updateLEDs()
    }

// LatLong Addressing. 
    /**
     * Set single LED to a given color (range 0-255 for r, g, b).
     * @param latitude latitudinal value 0-15
     * @param longitude longitudinal value 0-15
     * @param rgb RGB color of the LED
     */
    //% blockId="SetLLPixelColor" block="set LED at lat%latitude|long%longitude|to%rgb=FireColours"
    //% subcategory="Latitude Longitude"
    //% weight=100
    //% blockGap=8
    export function setLLPixelColor(latitude: number, longitude: number, rgb: number)
    {
        latitude = clamp(latitude, 0, 15);
        longitude = clamp(longitude, 0, 15);
        fire().setPixel(latitude*16+longitude, rgb);
        updateLEDs();
    }

// Advanced generic blocks

    /**
     * Set the brightness of the FireLed band
     * @param brightness a measure of LED brightness in 0-255. eg: 40
     */
    //% blockId="LedBrightness" block="set LED brightness%brightness"
    //% subcategory=Generic
    //% advanced=true
    //% brightness.min=0 brightness.max=255
    //% weight=100
    //% blockGap=8
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
    //% subcategory=Generic
    //% advanced=true
    //% weight=90
    //% blockGap=8
    export function setUpdateMode(mode: ledMode)
    {
        updateMode = mode;
    }

    /**
      * Show LED changes
      */
    //% blockId="LedShow" block="show LED changes"
    //% subcategory=Generic
    //% advanced=true
    //% weight=80
    //% blockGap=8
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
    //% subcategory=Generic
    //% advanced=true
    //% blockHidden=false
    //% weight=70
    //% blockGap=8
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
    //% subcategory=Generic
    //% advanced=true
    //% weight=60
    //% blockGap=8
    export function convertRGB(r: number, g: number, b: number): number
    {
        return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
    }

}
