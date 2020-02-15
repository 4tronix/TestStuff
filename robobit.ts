
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
    //% blockId="robobit_model" block="select 09 Robobit model%model"
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
    //% blockId="RBGo" block="go%direction|at speed%speed"
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
    //% blockId="RBGoms" block="go%direction|at speed%speed|for%milliseconds|ms"
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
    //% blockId="RBRotate" block="spin%direction|at speed%speed"
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
    //% blockId="RBRotatems" block="spin%direction|at speed%speed|for%milliseconds|ms"
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
    //% blockId="RBMove" block="move%motor|motor(s)%direction|at speed%speed"
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


}