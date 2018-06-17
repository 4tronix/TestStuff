
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
 * Custom blocks
 */
//% weight=10 color=#e7660b icon="\uf185"
namespace cubebit {

    let nCube: neopixel.Strip;

    /**
     * Create a Cube:Bit cube
     */
    //% blockId="cubebit_neo" block="create cube on Pin0 with side %side"
    //% weight=5
    //% side.min=3 side.max=5
    export function neo(side: number): neopixel.Strip {
        nCube = neopixel.create(DigitalPin.P0, side*side*side, NeoPixelMode.RGB)
        return nCube;
    }

    /**
      * Sets all pixels to a given colour (using colour names).
      *
      * @param rgb RGB colour of the pixel
      */
    //% blockId="cubebit_set_color" block="set all pixels to %rgb=neopixel_colors"
    //% weight=80
    export function setColor(rgb: number) {
        neo().showColor(rgb);
    }

    /**
     * Set a pixel to a given colour (using colour names).
     *
     * @param ID location of the pixel in the cube from 0
     * @param rgb RGB color of the LED
     */
    //% blockId="cubebit_set_pixel_color" block="set pixel color at %ID|to %rgb=neopixel_colors"
    //% weight=80
    export function setPixelColor(ID: number, rgb: number): void {
        neo().setPixelColor(ID, rgb);
    }

    /**
      * Show pixels
      */
    //% blockId="cubebit_show" block="show pixels"
    //% weight=76
    export function neoShow(): void {
        neo().show();
    }

    /**
      * Clear leds.
      */
    //% blockId="cubebit_clear" block="clear all pixels"
    //% weight=75
    export function neoClear(): void {
        neo().clear();
    }

    /**
      * Shows a rainbow pattern on all pixels
      */
    //% blockId="cubebit_rainbow" block="set pixel rainbow"
    //% weight=70
    export function neoRainbow(): void {
        neo().showRainbow(1, 360);
    }

    /**
     * Shift LEDs forward and clear with zeros.
     */
    //% blockId="cubebit_shift" block="shift pixels"
    //% weight=66
    export function neoShift(): void {
        neo().shift(1);
    }

    /**
     * Rotate LEDs forward.
     */
    //% blockId="cubebit_rotate" block="rotate pixels"
    //% weight=65
    export function neoRotate(): void {
        neo().rotate(1);
    }

    /**
     * Set the brightness of the cube. Note this only applies to future writes to the strip.
     *
     * @param brightness a measure of LED brightness in 0-255. eg: 255
     */
    //% blockId="cubebit_brightness" block="set led brightness %brightness"
    //% brightness.min=0 brightness.max=255
    //% weight=10
    export function neoBrightness(brightness: number): void {
        neo().setBrightness(brightness);
    }


}
