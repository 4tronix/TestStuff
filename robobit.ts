
/**
  * Eyeball directions
  */
enum eyePos
{
    //% block="forward"
    Forward,
    //% block="down"
    Down,
    //% block="up"
    Up,
    //% block="left"
    Left,
    //% block="right"
    Right,
    //% block="down-left"
    DownLeft,
    //% block="down-right"
    DownRight,
    //% block="up-left"
    UpLeft,
    //% block="up-right"
    UpRight
}

enum eyeSize
{
    //% block="small"
    Small,
    //% block="large"
    Large
}

enum bfEyes
{
    //% block="left"
    Left,
    //% block="right"
    Right,
    //% block="both"
    Both
}

enum bfMouth
{
    //% block="smile"
    Smile,
    //% block="grin"
    Grin,
    //% block="sad"
    Sad,
    //% block="frown"
    Frown,
    //% block="straight"
    Straight,
    //% block="oooh"
    Oooh,
    //% block="eeeh"
    Eeeh
}

/**
  * Enumeration of motors.
  */
enum RBMotor
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
enum RBDirection
{
    //% block="forward"
    Forward,
    //% block="reverse"
    Reverse
}

/**
  * Enumeration of directions.
  */
enum RBRobotDirection
{
    //% block="left"
    Left,
    //% block="right"
    Right
}

/**
  * Stop modes. Coast or Brake
  */
enum RBStopMode
{
    //% block="no brake"
    Coast,
    //% block="brake"
    Brake
}

/**
  * Enable/Disable for Bluetooth and FireLeds
  */
enum RBBluetooth
{
    //% block="Enable"
    btEnable,
    //% block="Disable"
    btDisable
}

/**
  * Enumeration of line sensors.
  */
enum RBLineSensor
{
    //% block="left"
    Left,
    //% block="right"
    Right
}


/**
  * Enumeration of Robobit Models and Options
  */
enum RBModel
{
    //% block="Mk1"
    Mk1,
    //% block="Mk2"
    Mk2, 
    //% block="Mk2/LedBar"
    Mk2A, 
    //% block="Mk3"
    Mk3
}

/**
  * Update mode for LEDs
  * setting to Manual requires show LED changes blocks
  * setting to Auto will update the LEDs everytime they change
  */
enum RBMode
{
    Manual,
    Auto
}

/**
 * Ping unit for sensor
 */
enum RBPingUnit
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
enum RBColors
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
//% weight=50 color=#e7660b icon="\uf1ba"
//% groups='["New style blocks","Basic","Advanced","Special","Ultrasonic","Line Sensor","5x5 Matrix","BitFace","OLED 128x64","Old style blocks"]'
namespace robobit
{
    let ledBar: fireled.Band;
    let _updateMode = RBMode.Auto;
    let btDisabled = true;
    let matrix5: fireled.Band;
    let bitface: fireled.Band;
    let mouthSmile: number[] = [0,1,2,3,4,5];
    let mouthGrin: number[] = [0,1,2,3,4,5,10,11,12,13];
    let mouthSad: number[] = [0,5,6,7,8,9];
    let mouthFrown: number[] = [0,5,6,7,8,9,10,11,12,13];
    let mouthStraight: number[] = [0,5,10,11,12,13];
    let mouthOooh: number[] = [1,2,3,4,6,7,8,9,10,13];
    let mouthEeeh: number[] = [0,1,2,3,4,5,6,7,8,9];
    let oled: firescreen.Screen;
    let leftBias = 0;
    let rightBias = 0;

    let lMotorD0 = DigitalPin.P0;
    let lMotorD1 = DigitalPin.P8;
    let lMotorA0 = AnalogPin.P0;
    let lMotorA1 = AnalogPin.P8;
    let rMotorD0 = DigitalPin.P1;
    let rMotorD1 = DigitalPin.P12;
    let rMotorA0 = AnalogPin.P1;
    let rMotorA1 = AnalogPin.P12;

    let _model: RBModel;
    let larsson: number;
    let scandir: number;
    let ledCount = 8;
    let leftSpeed = 0;
    let rightSpeed = 0;
    let _scanning = false;
    let scanColor1 = 0xff0000;
    let scanColor2 = 0x0f0000;
    let scanColor3 = 0x030000;

    function clamp(value: number, min: number, max: number): number
    {
        return Math.max(Math.min(max, value), min);
    }

// Block for selecting Robobit Model
    /**
      * Select Model of Robobit (Determines Pins used)
      * @param model Model of Robobit buggy. Mk1, Mk2, or Mk3
      */
    //% blockId="robobit_model" block="select 20 Robobit model%model"
    //% weight=100
    export function select_model(model: RBModel): void
    {
        _model = model;
    }

// Block to enable Bluetooth and disable FireLeds.
    /**
      * Enable/Disable Bluetooth support by disabling/enabling FireLeds
      * @param enable enable or disable Blueetoth
    */
    //% blockId="RBEnableBluetooth"
    //% block="%enable|Bluetooth"
    //% weight=90
    export function rbEnableBluetooth(enable: RBBluetooth)
    {
        if (enable == RBBluetooth.btEnable)
            btDisabled = false;
        else
            btDisabled = true;
    }

// New Style Motor Blocks
    // slow PWM frequency for slower speeds to improve torque
    function setPWM(speed: number): void
    {
        if (speed < 200)
            pins.analogSetPeriod(AnalogPin.P0, 60000);
        else if (speed < 300)
            pins.analogSetPeriod(AnalogPin.P0, 40000);
        else
            pins.analogSetPeriod(AnalogPin.P0, 30000);
    }

    /**
      * Move robot forward (or backward) at speed.
      * @param direction Move Forward or Reverse
      * @param speed speed of motor between 0 and 100. eg: 60
      */
    //% blockId="RBGo" block="go%direction|at speed%speed|\\%"
    //% speed.min=0 speed.max=100
    //% weight=100
    //% subcategory=Motors
    //% group="New style blocks"
    //% blockGap=8
    export function go(direction: RBDirection, speed: number): void
    {
        move(RBMotor.Both, direction, speed);
    }

    /**
      * Move robot forward (or backward) at speed for milliseconds
      * @param direction Move Forward or Reverse
      * @param speed speed of motor between 0 and 100. eg: 60
      * @param milliseconds duration in milliseconds to drive forward for, then stop. eg: 400
      */
    //% blockId="RBGoms" block="go%direction|at speed%speed|\\% for%milliseconds|ms"
    //% speed.min=0 speed.max=100
    //% weight=90
    //% subcategory=Motors
    //% group="New style blocks"
    //% blockGap=8
    export function goms(direction: RBDirection, speed: number, milliseconds: number): void
    {
        go(direction, speed);
        basic.pause(milliseconds);
        stop(RBStopMode.Coast);
    }

    /**
      * Rotate robot in direction at speed
      * @param direction direction to turn
      * @param speed speed of motors (0 to 100). eg: 60
      */
    //% blockId="RBRotate" block="spin%direction|at speed%speed|\\%"
    //% speed.min=0 speed.max=100
    //% weight=80
    //% subcategory=Motors
    //% group="New style blocks"
    //% blockGap=8
    export function rotate(direction: RBRobotDirection, speed: number): void
    {
        if (direction == RBRobotDirection.Left)
        {
            move(RBMotor.Left, RBDirection.Reverse, speed);
            move(RBMotor.Right, RBDirection.Forward, speed);
        }
        else if (direction == RBRobotDirection.Right)
        {
            move(RBMotor.Left, RBDirection.Forward, speed);
            move(RBMotor.Right, RBDirection.Reverse, speed);
        }
    }

    /**
      * Rotate robot in direction at speed for milliseconds.
      * @param direction direction to spin
      * @param speed speed of motor between 0 and 100. eg: 60
      * @param milliseconds duration in milliseconds to spin for, then stop. eg: 400
      */
    //% blockId="RBRotatems" block="spin%direction|at speed%speed|\\% for%milliseconds|ms"
    //% speed.min=0 speed.max=100
    //% weight=70
    //% subcategory=Motors
    //% group="New style blocks"
    //% blockGap=8
    export function rotatems(direction: RBRobotDirection, speed: number, milliseconds: number): void
    {
        rotate(direction, speed);
        basic.pause(milliseconds);
        stop(RBStopMode.Coast);
    }

    /**
      * Stop robot by coasting slowly to a halt or braking
      * @param mode Brakes on or off
      */
    //% blockId="RBstop" block="stop with%mode"
    //% weight=60
    //% subcategory=Motors
    //% group="New style blocks"
    //% blockGap=8
    export function stop(mode: RBStopMode): void
    {
        let stopMode = 0;
        if (mode == RBStopMode.Brake)
            stopMode = 1;
        pins.digitalWritePin(lMotorD0, stopMode);
        pins.digitalWritePin(lMotorD1, stopMode);
        pins.digitalWritePin(rMotorD0, stopMode);
        pins.digitalWritePin(rMotorD1, stopMode);
    }

    /**
      * Move individual motors forward or reverse
      * @param motor motor to drive
      * @param direction select forwards or reverse
      * @param speed speed of motor between 0 and 100. eg: 60
      */
    //% blockId="RBMove" block="move%motor|motor(s)%direction|at speed%speed|\\%"
    //% weight=50
    //% speed.min=0 speed.max=100
    //% subcategory=Motors
    //% group="New style blocks"
    //% blockGap=8
    export function move(motor: RBMotor, direction: RBDirection, speed: number): void
    {
        speed = clamp(speed, 0, 100) * 10.23;
        setPWM(speed);
        let lSpeed = Math.round(speed * (100 - leftBias) / 100);
        let rSpeed = Math.round(speed * (100 - rightBias) / 100);
        if ((motor == RBMotor.Left) || (motor == RBMotor.Both))
        {
            if (direction == RBDirection.Forward)
            {
                pins.analogWritePin(lMotorA0, lSpeed);
                pins.analogWritePin(lMotorA1, 0);
            }
            else
            {
                pins.analogWritePin(lMotorA0, 0);
                pins.analogWritePin(lMotorA1, lSpeed);
            }
        }
        if ((motor == RBMotor.Right) || (motor == RBMotor.Both))
        {
            if (direction == RBDirection.Forward)
            {
                pins.analogWritePin(rMotorA0, rSpeed);
                pins.analogWritePin(rMotorA1, 0);
            }
            else
            {
                pins.analogWritePin(rMotorA0, 0);
                pins.analogWritePin(rMotorA1, rSpeed);
            }
        }
    }

    /**
      * Set left/right bias to match motors
      * @param direction direction to turn more (if robot goes right, set this to left)
      * @param bias percentage of speed to bias with eg: 10
      */
    //% blockId="RBBias" block="bias%direction|by%bias|\\%"
    //% bias.min=0 bias.max=80
    //% weight=40
    //% subcategory=Motors
    //% group="New style blocks"
    //% blockGap=8
    export function RBBias(direction: RBRobotDirection, bias: number): void
    {
        bias = clamp(bias, 0, 80);
        if (direction == RBRobotDirection.Left)
        {
            leftBias = bias;
            rightBias = 0;
        }
        else
        {
            leftBias = 0;
            rightBias = bias;
        }
    }

// Old Motor Blocks - kept for compatibility
    /**
      * Drive robot forward (or backward) at speed.
      * @param speed speed of motor between -1023 and 1023. eg: 600
      */
    //% subcategory=Motors
    //% group="Old style blocks"
    //% blockId="robobit_motor_forward" block="drive at speed%speed"
    //% speed.min=-1023 speed.max=1023
    //% weight=110
    //% blockGap=8
    export function drive(speed: number): void
    {
        motor(RBMotor.Both, speed);
    }

    /**
      * Drive robot forward (or backward) at speed for milliseconds.
      * @param speed speed of motor between -1023 and 1023. eg: 600
      * @param milliseconds duration in milliseconds to drive forward for, then stop. eg: 1000
      */
    //% subcategory=Motors
    //% group="Old style blocks"
    //% blockId="robobit_motor_forward_milliseconds" block="drive at speed%speed|for%milliseconds|ms"
    //% speed.min=-1023 speed.max=1023
    //% weight=131
    //% blockGap=8
    export function driveMilliseconds(speed: number, milliseconds: number): void
    {
        drive(speed);
        basic.pause(milliseconds);
        drive(0);
    }

    /**
      * Spin robot in direction at speed.
      * @param direction direction to spin.
      * @param speed speed of motor between 0 and 1023. eg: 600
      */
    //% subcategory=Motors
    //% group="Old style blocks"
    //% blockId="robobit_turn" block="spin%direction|at speed%speed"
    //% speed.min=0 speed.max=1023
    //% weight=109
    //% blockGap=8
    export function driveTurn(direction: RBRobotDirection, speed: number): void
    {
        speed = clamp(speed, 0, 1023);
        if (direction == RBRobotDirection.Left)
        {
            motor(RBMotor.Left, -speed);
            motor(RBMotor.Right, speed);
        }
        else if (direction == RBRobotDirection.Right)
        {
            motor(RBMotor.Left, speed);
            motor(RBMotor.Right, -speed);
        }
    }

    /**
      * Turn robot in direction at speed for milliseconds.
      * @param direction direction to turn.
      * @param speed speed of motor between 0 and 1023. eg: 600
      * @param milliseconds duration in milliseconds to turn for, then stop. eg: 1000
      */
    //% subcategory=Motors
    //% group="Old style blocks"
    //% blockId="robobit_turn_milliseconds" block="spin%direction|at speed%speed|for%milliseconds|ms"
    //% speed.min=0 speed.max=1023
    //% weight=130
    //% blockGap=8
    export function driveTurnMilliseconds(direction: RBRobotDirection, speed: number, milliseconds: number): void
    {
        driveTurn(direction, speed)
        basic.pause(milliseconds)
        motor(RBMotor.Both, 0)
    }

    /**
      * Drive motor(s) forward or reverse.
      * @param motor motor to drive.
      * @param speed speed of motor eg: 600
      */
    //% subcategory=Motors
    //% group="Old style blocks"
    //% blockId="robobit_motor" block="drive%motor|motor at speed%speed"
    //% weight=100
    //% blockGap=8
    export function motor(motor: RBMotor, speed: number): void
    {
        speed = clamp(speed, -1023, 1023);
        let forward = (speed >= 0);
        let absSpeed = Math.abs(speed);
        if ((motor == RBMotor.Left) || (motor == RBMotor.Both))
            leftSpeed = absSpeed;
        if ((motor == RBMotor.Right) || (motor == RBMotor.Both))
            rightSpeed = absSpeed;
        setPWM(absSpeed);
        let realSpeed = speed;
        if (!forward)
        {
            if (realSpeed >= -200)
                realSpeed = (realSpeed * 19) / 6;
            else if (realSpeed >= -400)
                realSpeed = realSpeed * 2;
            else if (realSpeed >= -600)
                realSpeed = (realSpeed * 3) / 2;
            else if (realSpeed >= -800)
                realSpeed = (realSpeed * 5) / 4;
            realSpeed = 1023 + realSpeed; // realSpeed is negative
        }
        if ((motor == RBMotor.Left) || (motor == RBMotor.Both))
        {
            pins.analogWritePin(AnalogPin.P0, realSpeed);
            pins.digitalWritePin(DigitalPin.P8, forward ? 0 : 1);
        }
        if ((motor == RBMotor.Right) || (motor == RBMotor.Both))
        {
            pins.analogWritePin(AnalogPin.P1, realSpeed);
            pins.digitalWritePin(DigitalPin.P12, forward ? 0 : 1);
        }
    }

// Inbuilt LedBar Blocks (FireLeds)

    // create a FireLed band if not got one already. Default to brightness 40
    function fire(): fireled.Band
    {
        if (!ledBar)
        {
            ledBar = fireled.newBand(DigitalPin.P13, 8);
            ledBar.setBrightness(40);
        }
        return ledBar;
    }

    // update LedBar if _updateMode set to Auto
    function updateLEDs(): void
    {
        if (_updateMode == RBMode.Auto)
            ledShow();
    }

    /**
      * Sets all LEDs to a given color (range 0-255 for r, g, b).
      * @param rgb RGB color of the LED
      */
    //% blockId="robobit_set_led_color" block="set all LEDs to%rgb=rb_colours"
    //% weight=100
    //% subcategory=LedBar
    //% group=Basic
    //% blockGap=8
    export function setLedColor(rgb: number)
    {
        fire().setBand(rgb);
        updateLEDs();
    }

    /**
      * Clear all leds.
      */
    //% blockId="robobit_led_clear" block="clear all LEDs"
    //% weight=90
    //% subcategory=LedBar
    //% group=Basic
    //% blockGap=8
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
    //% blockId="robobit_set_pixel_color" block="set LED at%ledId|to%rgb=rb_colours"
    //% weight=80
    //% subcategory=LedBar
    //% group=Basic
    //% blockGap=8
    export function setPixelColor(ledId: number, rgb: number): void
    {
        fire().setPixel(ledId, rgb);
        updateLEDs();
    }

    /**
      * Shows a rainbow pattern on all LEDs.
      */
    //% blockId="robobit_rainbow" block="set LED rainbow"
    //% weight=70
    //% subcategory=LedBar
    //% group=Basic
    //% blockGap=8
    export function ledRainbow(): void
    {
        fire().setRainbow();
        updateLEDs()
    }

    /**
     * Shift LEDs forward and clear with zeros.
     */
    //% blockId="robobit_led_shift" block="shift LEDs"
    //% weight=60
    //% subcategory=LedBar
    //% group=Basic
    //% blockGap=8
    export function ledShift(): void
    {
        fire().shiftBand();
        updateLEDs()
    }

    /**
     * Rotate LEDs forward.
     */
    //% blockId="robobit_led_rotate" block="rotate LEDs"
    //% weight=50
    //% subcategory=LedBar
    //% group=Basic
    //% blockGap=8
    export function ledRotate(): void
    {
        fire().rotateBand();
        updateLEDs()
    }

    /**
      * Start Scanner
      * @param color the colour to use for scanning
      * @param delay time in ms between scan steps, eg: 100,50,200,500
      */
    //% blockId="rb_startScanner" block="start scan%color=rb_colours|with%delay|ms"
    //% subcategory=LedBar
    //% group=Basic
    //% delay.min=1 delay.max=10000
    //% weight=40
    //% blockGap=8
    export function startScanner(color: number, delay: number): void
    {
        scanColor1 = color;
        scanColor2 = reduce(scanColor1, 8);
        scanColor3 = reduce(scanColor2, 4);
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
    function reduce(color: number, reducer: number): number
    {
        let red = ((color & 0xff0000) / reducer) & 0xff0000;
        let green = ((color & 0x00ff00) / reducer) & 0x00ff00;
        let blue = ((color & 0x0000ff) / reducer) & 0x0000ff;
        return red + green + blue;
    }

    /**
      * Stop Scanner
      */
    //% block
    //% subcategory=LedBar
    //% group=Basic
    //% weight=30
    //% blockGap=8
    export function stopScanner(): void
    {
        _scanning = false;
    }

    /**
     * Use centre 6 LEDs as Larsson Scanner. Each call moves the scan by one pixel
     */
    //% subcategory=LedBar
    //% group=Basic
    //% blockId="robobit_ledScan" block="scan centre pixels"
    //% weight=20
    //% blockGap=8
    //% deprecated=true
    export function ledScan(): void
    {
        if (!larsson)
        {
            larsson = 1;
            scandir = 1;
        }
        larsson += scandir;
        if (larsson >= (ledCount - 2))
            scandir = -1;
        else if (larsson <= 1)
            scandir = 1;
        for (let x = 1; x < (ledCount-1); x++)
        {
            if ((x == (larsson - 2)) || (x == (larsson + 2)))
                setPixelColor(x, scanColor3);
            else if ((x == (larsson - 1)) || (x == (larsson + 1)))
                setPixelColor(x, scanColor2);
            else if (x == larsson)
                setPixelColor(x, scanColor1);
            else
                setPixelColor(x, 0);
        }
    }

// Advanced blocks

    /**
     * Set the brightness of the LedBar
     * @param brightness a measure of LED brightness in 0-255. eg: 40
     */
    //% blockId="robobit_led_brightness" block="set LedBar brightness%brightness"
    //% brightness.min=0 brightness.max=255
    //% weight=100
    //% subcategory=LedBar
    //% group=Advanced
    //% blockGap=8
    export function ledBrightness(brightness: number): void
    {
        fire().setBrightness(brightness);
        updateLEDs();
    }

    /**
      * Set LED update mode (Manual or Automatic)
      * @param updateMode setting automatic will show LED changes automatically
      */
    //% blockId="robobit_set_updateMode" block="set%updateMode|update mode"
    //% weight=90
    //% subcategory=LedBar
    //% group=Advanced
    //% blockGap=8
    export function setUpdateMode(updateMode: RBMode): void
    {
        _updateMode = updateMode;
    }

    /**
      * Show LED changes
      */
    //% blockId="RBledShow" block="show LedBar changes"
    //% weight=80
    //% subcategory=LedBar
    //% group=Advanced
    //% blockGap=8
    export function ledShow(): void
    {
        if (btDisabled)
            fire().updateBand();
    }

    /**
      * Get numeric value of colour
      * @param color Standard RGB Led Colours eg: #ff0000
      */
    //% blockId="rb_colours" block=%color
    //% blockHidden=false
    //% weight=70
    //% subcategory=LedBar
    //% group=Advanced
    //% blockGap=8
    //% shim=TD_ID colorSecondary="#e7660b"
    //% color.fieldEditor="colornumber"
    //% color.fieldOptions.decompileLiterals=true
    //% color.defl='#ff0000'
    //% color.fieldOptions.colours='["#FF0000","#659900","#18E600","#80FF00","#00FF00","#FF8000","#D82600","#B24C00","#00FFC0","#00FF80","#FFC000","#FF0080","#FF00FF","#B09EFF","#00FFFF","#FFFF00","#8000FF","#0080FF","#0000FF","#FFFFFF","#FF8080","#80FF80","#40C0FF","#999999","#000000"]'
    //% color.fieldOptions.columns=5
    //% color.fieldOptions.className='rgbColorPicker'
    export function RBColours(color: number): number
    {
        return color;
    }

    /**
      * Convert from RGB values to colour number
      * @param red Red value of the LED (0 to 255)
      * @param green Green value of the LED (0 to 255)
      * @param blue Blue value of the LED (0 to 255)
      */
    //% blockId="robobit_convertRGB" block="convert from red%red|green%green|blue%blue"
    //% weight=60
    //% subcategory=LedBar
    //% group=Advanced
    //% blockGap=8
    export function convertRGB(r: number, g: number, b: number): number
    {
        return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
    }


// Inputs and Outputs (Sensors)
    /**
    * Read distance from sonar module connected to accessory connector.
    * @param unit desired conversion unit
    */
    //% blockId="robobit_sonar" block="read sonar as%unit"
    //% weight=100
    //% subcategory="Inputs & Outputs"
    export function sonar(unit: RBPingUnit): number
    {
        // send pulse
        let trig = DigitalPin.P13;
	if (_model == RBModel.Mk3)
	    trig = DigitalPin.P15;
	if (_model == RBModel.Mk2A)
	    trig = DigitalPin.P15;
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
            case RBPingUnit.Centimeters: return Math.round(d / 58);
            case RBPingUnit.Inches: return Math.round(d / 148);
            default: return d;
        }
    }

    /**
      * Read line sensor.
      * @param sensor Line sensor to read.
      */
    //% blockId="robobit_read_line" block="read%sensor|line sensor"
    //% weight=90
    //% subcategory="Inputs & Outputs"
    export function readLine(sensor: RBLineSensor): number
    {
        if (sensor == RBLineSensor.Left)
	{
	    if (_model == RBModel.Mk3)
            	return pins.digitalReadPin(DigitalPin.P16);
	    else
            	return pins.digitalReadPin(DigitalPin.P11);
        }
        else
	{
	    if (_model == RBModel.Mk3)
            	return pins.digitalReadPin(DigitalPin.P14);
	    else
            	return pins.digitalReadPin(DigitalPin.P5);
        }
    }

    /**
      * Adjust opening of Talon attachment
      * @param degrees Degrees to open Talon. eg: 30
      */
    //% blockId="robobit_set_talon" block="open talon%degrees|degrees"
    //% weight=80
    //% degrees.min=0 degrees.max=80
    //% subcategory="Inputs & Outputs"
    export function setTalon(degrees: number): void
    {
        degreees = clamp(degrees, 0, 80);
        pins.servoWritePin(AnalogPin.P13, degrees);
    }


}
