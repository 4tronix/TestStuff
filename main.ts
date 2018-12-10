
/**
  * Enumeration of buttons
  */
enum BCButtons {
    //% block="red"
    Red,
    //% block="yellow"
    Yellow,
    //% block="green"
    Green,
    //% block="blue"
    Blue,
    //% block="joystick"
    Joystick
}

/**
  * Enumeration of joystick axes
  */
enum BCJoystick {
    //% block="x"
    X,
    //% block="y"
    Y
}

/**
 * Pre-Defined LED colours
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
 * Pins used to generate events
 */
enum BCPins {
    //% block="red"
    P12 = <number>DAL.MICROBIT_ID_IO_P12,
    //% block="yellow"
    P16 = DAL.MICROBIT_ID_IO_P16,
    //% block="green"
    P14 = DAL.MICROBIT_ID_IO_P14,
    //% block="blue"
    P15 = DAL.MICROBIT_ID_IO_P15,
    //% block="joystick"
    Joystick = DAL.MICROBIT_ID_IO_P8
}

/**
 * Button events
 */
enum BCEvents {
    //% block="down"
    Down = DAL.MICROBIT_BUTTON_EVT_UP,
    //% block="up"
    Up = DAL.MICROBIT_BUTTON_EVT_DOWN,
    //% block="click"
    Click = DAL.MICROBIT_BUTTON_EVT_CLICK
}

/**
 * Custom blocks
 */
//% weight=10 color=#e7660b icon="\uf11b"
namespace bitcommander
{
    let neoStrip: neopixel.Strip;

// Inputs. Buttons, Dial and Joystick

    //% shim=bitcommander::init
    function init(): void
    {
        return;
    }

    /**
      * Registers event code
      */
    //% weight=90
    //% blockId=bc_onevent block="on 02 button %button|%event"
    //% subcategory=Inputs
    //% group=Inputs
    export function onEvent(button: BCPins, event: BCEvents, handler: Action)
    {
        init();
        control.onEvent(<number>button, <number>event, handler); // register handler
    }

    /**
      * check button states
      *
      * @param buttonID Button to check
      */
    //% blockId="bitcommander_check_button" block="button %buttonID"
    //% weight=85
    //% subcategory=Inputs
    //% group=Inputs
    export function readButton(buttonID: BCButtons): number
    {
	switch (buttonID)
	{
            case BCButtons.Red: return pins.digitalReadPin(DigitalPin.P12); break;
            case BCButtons.Yellow: return pins.digitalReadPin(DigitalPin.P16); break;
            case BCButtons.Green: return pins.digitalReadPin(DigitalPin.P14); break;
            case BCButtons.Blue: return pins.digitalReadPin(DigitalPin.P15); break;
            case BCButtons.Joystick: return pins.digitalReadPin(DigitalPin.P8); break;
	    default: return 0;
	}
    }

    /**
      * Read dial
      *
      */
    //% blockId="bitcommander_read_dial" block="dial"
    //% weight=90
    //% subcategory=Inputs
    //% group=Inputs
    export function readDial( ): number
    {
        return pins.analogReadPin(AnalogPin.P0);
    }

    /**
      * Read joystick values
      *
      * @param axis Axis to read
      */
    //% blockId="bitcommander_read_joystick" block="joystick %axis"
    //% weight=90
    //% subcategory=Inputs
    //% group=Inputs
    export function readJoystick(axis: BCJoystick): number
    {
        if (axis == BCJoystick.X)
            return pins.analogReadPin(AnalogPin.P1);
        else
            return pins.analogReadPin(AnalogPin.P2);
    }


// LEDs. neopixel blocks

    /**
      * Sets all LEDs to a given color (range 0-255 for r, g, b).
      *
      * @param rgb RGB color of the LED
      */
    //% blockId="bitcommander_neo_set_color" block="set LEDs to %rgb=bc_colours"
    //% weight=80
    //% subcategory=Leds
    //% group=Leds
    export function neoSetColor(rgb: number)
    {
        neo().showColor(rgb);
    }

    // create a neopixel strip if not got one already
    function neo(): neopixel.Strip
    {
        if (!neoStrip)
            neoStrip = neopixel.create(DigitalPin.P13, 6, NeoPixelMode.RGB)
        return neoStrip;
    }

    /**
     * Convert from RGB values to colour number
     *
     * @param red Red value of the LED 0:255
     * @param green Green value of the LED 0:255
     * @param blue Blue value of the LED 0:255
     */
    //% subcategory=Leds
    //% group=Leds
    //% blockId="bitcommander_convertRGB" block="convert from red %red| green %green| blue %bblue"
    //% weight=55
    export function convertRGB(r: number, g: number, b: number): number
    {
        return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
    }

    /**
      * Gets numeric value of colour
      *
      * @param color Standard RGB Led Colours
      */
    //% subcategory=Leds
    //% group=Leds
    //% blockId="bc_colours" block=%color
    //% weight=60
    export function BCColours(color: BCColors): number
    {
        return color;
    }

    /**
     * Set LED to a given color (range 0-255 for r, g, b).
     *
     * @param ledId position of the LED (0 to 5)
     * @param rgb RGB color of the LED
     */
    //% blockId="bitcommander_neo_set_pixel_color" block="set LED at %ledId|to %rgb=bc_colors"
    //% weight=80
    //% subcategory=Leds
    //% group=Leds
    export function neoSetPixelColor(ledId: number, rgb: number): void
    {
        neo().setPixelColor(ledId, rgb);
    }

    /**
      * Show leds.
      */
    //% blockId="bitcommander_neo_show" block="show LED changes"
    //% weight=76
    //% subcategory=Leds
    //% group=Leds
    export function neoShow(): void
    {
        neo().show();
    }

    /**
      * Clear leds.
      */
    //% blockId="bitcommander_neo_clear" block="clear LEDs"
    //% weight=75
    //% subcategory=Leds
    //% group=Leds
    export function neoClear(): void
    {
        neo().clear();
    }

    /**
      * Shows a rainbow pattern on all LEDs.
      */
    //% blockId="bitcommander_neo_rainbow" block="set led rainbow"
    //% weight=70
    export function neoRainbow(): void
    {
        neo().showRainbow(1, 360);
    }

    /**
     * Shift LEDs forward and clear with zeros.
     */
    //% blockId="bitcommander_neo_shift" block="shift LEDs"
    //% weight=66
    //% subcategory=Leds
    //% group=Leds
    export function neoShift(): void
    {
        neo().shift(1);
    }

    /**
     * Rotate LEDs forward.
     */
    //% blockId="bitcommander_neo_rotate" block="rotate LEDs"
    //% weight=65
    //% subcategory=Leds
    //% group=Leds
    export function neoRotate(): void
    {
        neo().rotate(1);
    }

    /**
     * Set the brightness of the LEDs
     * @param brightness a measure of LED brightness (0 to 255) eg: 40
     */
    //% blockId="bitcommander_neo_brightness" block="set led brightness %brightness"
    //% brightness.min=0 brightness.max=255
    //% weight=10
    //% subcategory=Leds
    //% group=Leds
    export function neoBrightness(brightness: number): void
    {
        neo().setBrightness(brightness);
    }


}
