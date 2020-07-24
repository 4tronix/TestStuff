
/**
  * Enumeration of axes
  */
enum CBAxis {
    //% block="xy"
    XY,
    //% block="xz"
    XZ,
    //% block="yz"
    YZ
}

/**
  * Update mode for LEDs
  * setting to Manual requires show LED changes blocks
  * setting to Auto will update the LEDs everytime they change
  */
enum CBMode
{
    Manual,
    Auto
}

/**
  * Pre-Defined LED colours
  */
enum CBColors
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
//% weight=10 color=#e7660b icon="\uf247"
namespace cubebit {

    // create the character generator for 5x5
    // 5 bytes per character. LSB is rightmost bit, first byte is top line
    // just numbers for now 0..9, plus colon
    let font: Buffer
    font = hex`
    0c1212120c
    040c04040e
    1c020c101e
    1e0204120c
    060a121f02
    1f101e011e
    02040e110e
    1f02040810
    0e110e110e
    0e110e0408
    0008000800`;


    let nCube: fireled.Band;
    let btEnabled = false;
    let cubeHeight: number;
    let cubeSide: number;
    let cubeSide2: number;
    let cubeSide3: number;
    let _updateMode = CBMode.Auto;

// Helper functions

    function clamp(value: number, min: number, max: number): number
    {
        return Math.max(Math.min(max, value), min);
    }

    function pixelMap(x: number, y: number, z: number): number
    {
        if (cubeSide == 9)	// need to change to separate flag for cubes built out of smaller slices
            return pMap8(x, y, z);
        else
            return pMap(x, y, z, cubeSide);
    }

    //pMap8 is mapping function for 8x8 built out of 4x4 slices. 0,0,0 is not ID=0, it is in fact 268
    function pMap8(x: number, y: number, z: number): number
    {
        if (x<4 && y<4)  // column 0 (front left)
        {
            return 256 + pMap(3-x, 3-y, z, 4);
        }
        else if (x>=4 && y<4)  // column 1 (front right)
        {
            if ((z%2) == 0)
                return 255 - pMap(y, x-4, z, 4);
            else
                return 255 - pMap(3-y, 7-x, z, 4);
        }
        else if (x<4 && y>=4)  // column 2 (back left)
        {
            if ((z%2) == 0)
                return 511 - pMap(7-y, 3-x, z, 4);
            else
                return 511 - pMap(y-4, x, z, 4);
        }
        else  // column 3 (back right)
        {
            return pMap(x-4, y-4, z, 4);
        }
    }

    function pMap(x: number, y: number, z: number, side: number): number
    {
        let q=0;
        if (x<side && y<side && z<cubeHeight && x>=0 && y>=0 && z>=0)
        {
            if ((z%2) == 0)
            {
                if ((y%2) == 0)
                    q = y * side + x;
                else
                    q = y * side + side - 1 - x;
            }
            else
            {
                if ((side%2) == 0)
                    y = side - y - 1;
                if ((x%2) == 0)
                    q = side * (side - x) - 1 - y;
                else
                    q = (side - 1 - x) * side + y;
            }
            return z*side*side + q;
        }
        return cubeSide3;    // extra non-existent pixel for out of bounds
    }

    // create a FireLed band if not got one already. Default to brightness 40
    function fire(pin: DigitalPin, side: number): fireled.Band
    {
        if (!nCube)
        {
            if (! cubeHeight)
                cubeHeight = side;
            cubeSide = side;
            cubeSide2 = side * side;
            cubeSide3 = side * side * cubeHeight;
            nCube = fireled.newBand(pin, cubeSide3);
            nCube.setBrightness(40);
        }
        return nCube;
    }

    // update FireLeds if updateMode set to Auto  
    function updateLEDs()
    {
        if (_updateMode == CBMode.Auto)
            ledShow();
    }

// Main exported functions

    /**
     * Create a Cube:Bit cube (default 3x3x3) on Selected Pin (default Pin0)
     * @param pin Micro:Bit pin to connect to Cube:Bit
     * @param side number of pixels on each side. eg: 3, 4, 5, 8
     */
    //% blockId="cbCreate" block="create Cube:Bit on%pin|with side%side"
    //% weight=100
    //% side.min=3 side.max=8
    export function create(pin: DigitalPin, side: number): void
    {
        side = clamp(side, 3, 8);
        fire(pin, side);
    }

    /**
      * Sets all pixels to a given color
      * @param rgb RGB color of the LED
      */
    //% blockId="cbSetLedColor" block="set all pixels to%rgb=FireColours"
    //% weight=90
    export function setLedColor(rgb: number)
    {
        fire(DigitalPin.P0,3).setBand(rgb);
        updateLEDs();
    }

    /**
      * Clear all pixels.
      */
    //% blockId="cbLedClear" block="clear all pixels"
    //% weight=80
    export function ledClear()
    {
        fire(DigitalPin.P0,3).clearBand();
        updateLEDs();
    }

    /**
     * Set a pixel to a given colour.
     * @param ledId location of the pixel in the cube from 0
     * @param rgb RGB color of the LED
     */
    //% blockId="SetPixelColor" block="set pixel at%ledId|to%rgb=FireColours"
    //% weight=70
    export function setPixelColor(ledId: number, rgb: number)
    {
        fire(DigitalPin.P0,3).setPixel(ledId, rgb);
        updateLEDs();
    }

    /**
      * Sets a plane of pixels to given colour
      * @param plane number of plane from 0 to size of cube
      * @param axis axis (xy,xz,yz) of the plane
      * @param rgb RGB colour of the pixel
      */
    //% blockId="cbSetPlane" block="set plane%plane|on axis%axis=CBAxis|to %rgb=FireColours"
    //% weight=60
    export function setPlane(plane: number, axis: CBAxis, rgb: number): void
    {
        if (axis == CBAxis.YZ)
        {
            for (let y=0; y<cubeSide; y++)
                for (let z=0; z<cubeHeight; z++)
                    nCube.setPixel(pixelMap(plane,y,z), rgb);
        }
        else if (axis == CBAxis.XZ)
        {
            for (let x=0; x<cubeSide; x++)
                for (let z=0; z<cubeHeight; z++)
                    nCube.setPixel(pixelMap(x,plane,z), rgb);
        }
        else if (axis == CBAxis.XY)
        {
            for (let x=0; x<cubeSide; x++)
                for (let y=0; y<cubeSide; y++)
                    nCube.setPixel(pixelMap(x,y,plane), rgb);
        }
        updateLEDs();
    }

    /**
     * Get the pixel ID from x, y, z coordinates
     * @param x position from left to right (x dimension)
     * @param y position from front to back (y dimension)
     * @param z position from bottom to top (z dimension)
     */
    //% blockId="cbMapPixel" block="map ID from x%x|y%y|z%z"
    //% weight=50
    export function mapPixel(x: number, y: number, z: number): number
    {
        return pixelMap(x,y,z);
    }

    /**
      * Shows a rainbow pattern on all pixels
      */
    //% blockId="cbLedRainbow" block="set Cube:Bit rainbow"
    //% weight=40
    export function ledRainbow()
    {
        fire(DigitalPin.P0,3).setRainbow();
        updateLEDs()
    }

    /**
     * Rotate LEDs forward.
     */
    //% blockId="cbLedRotate" block="rotate pixels"
    //% weight=30
    export function ledRotate()
    {
        fire(DigitalPin.P0,3).rotateBand();
        updateLEDs()
    }

    /**
      * Sets a plane of pixels to selected character (only 5x5x5 cubes)
      * @param digit number from 0 to 9. 10 is colon
      * @param plane number of plane from 0 to size of cube
      * @param axis axis (xy,xz,yz) of the plane
      * @param rgb RGB colour of the pixels
      */
    //% blockId="cbShowChar" block="show %digit|on%plane|on axis%axis=CBAxis|in %rgb=FireColours"
    //% weight=20
    //% inlineInputMode=inline
    export function showChar(digit: number, plane: number, axis: CBAxis, rgb: number): void
    {
        let bufIndex = digit * 5 + 4;
        digit = clamp(digit, 0, 10);
        if (axis == CBAxis.YZ)
        {
            for (let y=0; y<cubeSide; y++)
            {
                let mask = 0b0000001;
                for (let z=0; z<cubeHeight; z++)
                {
                    if ((font[bufIndex - y] & mask) != 0)
                        nCube.setPixel(pixelMap(plane,y,z), rgb);
                    else
                        nCube.setPixel(pixelMap(plane,y,z), 0);
                    mask = mask << 1;
                }
            }
        }
        else if (axis == CBAxis.XZ)
        {
            for (let x=0; x<cubeSide; x++)
            {
                let mask = 0b0000001;
                for (let z=0; z<cubeHeight; z++)
                {
                    if ((font[bufIndex - x] & mask) != 0)
                        nCube.setPixel(pixelMap(x,plane,z), rgb);
                    else
                        nCube.setPixel(pixelMap(x,plane,z), 0);
                    mask = mask << 1;
                }
            }
        }
        else if (axis == CBAxis.XY)
        {
            for (let x=0; x<cubeSide; x++)
            {
                let mask = 0b0000001;
                for (let y=0; y<cubeSide; y++)
                {
                    if ((font[bufIndex - x] & mask) != 0)
                        nCube.setPixel(pixelMap(x,y,plane), rgb);
                    else
                        nCube.setPixel(pixelMap(x,y,plane), 0);
                    mask = mask << 1;
                }
            }
        }
        updateLEDs();
    }

    /**
      * Sets a plane of pixels to string of characters with selected delay (only 5x5x5 cubes)
      * @param txt string of numbers or colon
      * @param plane number of plane from 0 to size of cube
      * @param axis axis (xy,xz,yz) of the plane
      * @param rgb RGB colour of the pixels
      * @param delay number of ms between digits. eg: 500
      */
    //% blockId="cbShowString" block="show 08 %txt|on plane%plane|axis%axis=CBAxis|in %rgb=FireColours|delay%delay|ms"
    //% weight=10
    //% inlineInputMode=inline
    export function showString(txt: string, delay: number, plane: number, axis: CBAxis, rgb: number, delay: number): void
    {
        for (let n = 0; n < txt.length; n++)
        {
            let c = txt.charAt(n) - 48;
            if (c == 16)
                c = 10;	// set to colon
            showChar(c, plane, axis, rgb);
            basic.pause(delay);
        }
    }


// Advanced blocks

    /**
     * Set the brightness of the cube.
     * @param brightness a measure of LED brightness in 0-255. eg: 40
     */
    //% blockId="cbLedBrightness" block="set Cube:Bit brightness%brightness"
    //% brightness.min=0 brightness.max=255
    //% weight=100
    //% advanced=true
    export function ledBrightness(brightness: number): void
    {
        fire(DigitalPin.P0,3).setBrightness(brightness);
        updateLEDs();
    }

    /**
      * Set LED update mode (Manual or Automatic)
      * @param updateMode setting automatic will show LED changes automatically
      */
    //% blockId="cbSetUpdateMode" block="set%updateMode|update mode"
    //% weight=90
    //% advanced=true
    export function setUpdateMode(updateMode: CBMode): void
    {
        _updateMode = updateMode;
    }

    /**
      * Show all changes
      */
    //% blockId="cbLedShow" block="show Cube:Bit changes"
    //% weight=80
    //% advanced=true
    export function ledShow(): void
    {
        if (! btEnabled)
            fire(DigitalPin.P0,3).updateBand();
    }

    /**
     * Shift LEDs forward and clear with zeros.
     */
    //% blockId="cbLedShift" block="shift pixels"
    //% weight=70
    //% advanced=true
    export function ledShift(): void
    {
        fire(DigitalPin.P0,3).shiftBand();
        updateLEDs();
    }

    /**
      * Get numeric value of colour
      * @param colour Standard RGB Led Colours eg: #ff0000
      */
    //% blockId="FireColours" block=%colour
    //% subcategory=Generic
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
    //% blockId="cbConvertRGB" block="convert from red%red|green%green|blue%bblue"
    //% weight=50
    //% advanced=true
    export function convertRGB(r: number, g: number, b: number): number
    {
        return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
    }

    /**
      * Defines a custom height for the Cube (height>0)
      * define the height BEFORE creating the cube
      * @param height number of slices in the tower. eg: 4
      */
    //% blockId="cbSetHeight" block="set height of tower to%height"
    //% weight=65
    //% advanced=true
    export function setHeight(height: number): void
    {
        if (! cubeHeight)
            cubeHeight = height;
    }

}
