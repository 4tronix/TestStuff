
/**
  * Enumeration of motors.
  */
enum BBMotor
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
enum BBDirection
{
    //% block="forward"
    Forward,
    //% block="reverse"
    Reverse
}

/**
  * Enumeration of directions.
  */
enum BBRobotDirection
{
    //% block="left"
    Left,
    //% block="right"
    Right
}

/**
  * Stop modes. Coast or Brake
  */
enum BBStopMode
{
    //% block="no brake"
    Coast,
    //% block="brake"
    Brake
}

/**
  * Enable/Disable for Bluetooth and FireLeds
  */
enum BBBluetooth
{
    //% block="Enable"
    btEnable,
    //% block="Disable"
    btDisable
}

/**
  * Values for buzzer. On or Off
  */
enum BBBuzz
{
    //% block="on"
    On,
    //% block="off"
    Off
}

/**
  * Enumeration of line sensors.
  */
enum BBLineSensor
{
    //% block="left"
    Left,
    //% block="right"
    Right
}

/**
  * Enumeration of light sensors.
  */
enum BBLightSensor
{
    //% block="left"
    Left,
    //% block="right"
    Right
}

/**
 * Ping unit for sensor.
 */
enum BBPingUnit
{
    //% block="cm"
    Centimeters,
    //% block="inches"
    Inches,
    //% block="μs"
    MicroSeconds
}

/**
  * Update mode for LEDs
  * setting to Manual requires show LED changes blocks
  * setting to Auto will update the LEDs everytime they change
  */
enum BBMode
{
    Manual,
    Auto
}

/**
  * Model Types of BitBot
  * Classic or XL
  */
enum BBModel
{
    Classic,
    XL,
    Auto
}

/**
  * Pre-Defined LED colours
  */
enum BBColors
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
//% weight=50 color=#e7660b icon="\uf1b9"
//% groups='["New style blocks","Basic","Advanced","Special","Ultrasonic","Line Sensor","5x5 Matrix","BitFace","OLED 128x64","Old style blocks"]'
namespace bitbot
{
    let fireBand: fireled.Band;
    let _updateMode = BBMode.Auto;
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

    let _model = BBModel.Auto;
    let i2caddr = 28;
    let lMotorD0: DigitalPin;
    let lMotorD1: DigitalPin;
    let lMotorA0: AnalogPin;
    let lMotorA1: AnalogPin;
    let rMotorD0: DigitalPin;
    let rMotorD1: DigitalPin;
    let rMotorA0: AnalogPin;
    let rMotorA1: AnalogPin;

    function clamp(value: number, min: number, max: number): number
    {
        return Math.max(Math.min(max, value), min);
    }

// Block to enable Bluetooth and disable FireLeds.
    /**
      * Enable/Disable Bluetooth support by disabling/enabling FireLeds
      * @param enable enable or disable Blueetoth
    */
    //% blockId="BBEnableBluetooth"
    //% block="%enable| 10 Bluetooth"
    //% blockGap=8
    export function bbEnableBluetooth(enable: BBBluetooth)
    {
        if (enable == BBBluetooth.btEnable)
            btDisabled = false;
        else
            btDisabled = true;
    }

// Blocks for selecting BitBot Model
    /**
      * Force Model of BitBot (Determines Pins used)
      * @param model Model of BitBot; Classic or XL
      */
    //% blockId="bitbot_model" block="select BitBot model %model"
    //% weight=100
    //% subcategory=BitBot_Model
    export function select_model(model: BBModel): void
    {
        if((model==BBModel.Classic) || (model==BBModel.XL) || (model==BBModel.Auto))
        {
            _model = model;
            if (_model == BBModel.Classic)
            {
                lMotorD0 = DigitalPin.P0;
                lMotorD1 = DigitalPin.P8;
                lMotorA0 = AnalogPin.P0;
                lMotorA1 = AnalogPin.P8;
                rMotorD0 = DigitalPin.P1;
                rMotorD1 = DigitalPin.P12;
                rMotorA0 = AnalogPin.P1;
                rMotorA1 = AnalogPin.P12;
            }
            else
            {
                lMotorD0 = DigitalPin.P16;
                lMotorD1 = DigitalPin.P8;
                lMotorA0 = AnalogPin.P16;
                lMotorA1 = AnalogPin.P8;
                rMotorD0 = DigitalPin.P14;
                rMotorD1 = DigitalPin.P12;
                rMotorA0 = AnalogPin.P14;
                rMotorA1 = AnalogPin.P12;
            }
        }
    }

    /**
      * get Model of BitBot (Classic or XL)
      */
    //% blockId="bb_model" block="BitBot model"
    //% weight=90
    //% subcategory=BitBot_Model
    export function getModel(): BBModel
    {
        if (_model == BBModel.Auto)
        {
            if ((pins.i2cReadNumber(i2caddr, NumberFormat.Int8LE, false) & 0xf0) == 0)
            {
                select_model(BBModel.Classic);
            }
            else
            {
                select_model(BBModel.XL);
                pins.digitalWritePin(DigitalPin.P0, 0);
            }
        }
        return _model;
    }

    /**
      * Get numeric value of BitBot Model
      *
      * @param model BitBot Model eg: BBModel.Classic
      */
    //% blockId="bb_models" block=%model
    //% weight=80
    //% subcategory=BitBot_Model
    export function BBModels(model: BBModel): number
    {
        return model;
    }

// New Style Motor Blocks
    // slow PWM frequency for slower speeds to improve torque
    function setPWM(speed: number): void
    {
        if (speed < 200)
            pins.analogSetPeriod(lMotorA0, 60000);
        else if (speed < 300)
            pins.analogSetPeriod(lMotorA0, 40000);
        else
            pins.analogSetPeriod(lMotorA0, 30000);
    }

    /**
      * Move robot forward (or backward) at speed.
      * @param direction Move Forward or Reverse
      * @param speed speed of motor between 0 and 100. eg: 60
      */
    //% blockId="BBGo" block="go %direction|at speed %speed"
    //% speed.min=0 speed.max=100
    //% weight=100
    //% subcategory=Motors
    //% group="New style blocks"
    //% blockGap=8
    export function go(direction: BBDirection, speed: number): void
    {
        move(BBMotor.Both, direction, speed);
    }

    /**
      * Move robot forward (or backward) at speed for milliseconds
      * @param direction Move Forward or Reverse
      * @param speed speed of motor between 0 and 100. eg: 60
      * @param milliseconds duration in milliseconds to drive forward for, then stop. eg: 400
      */
    //% blockId="BBGoms" block="go %direction|at speed %speed|for %milliseconds|(ms)"
    //% speed.min=0 speed.max=100
    //% weight=90
    //% subcategory=Motors
    //% group="New style blocks"
    //% blockGap=8
    export function goms(direction: BBDirection, speed: number, milliseconds: number): void
    {
        go(direction, speed);
        basic.pause(milliseconds);
        stop(BBStopMode.Coast);
    }

    /**
      * Rotate robot in direction at speed
      * @param direction direction to turn
      * @param speed speed of motors (0 to 100). eg: 60
      */
    //% blockId="BBRotate" block="spin %direction|at speed %speed"
    //% speed.min=0 speed.max=100
    //% weight=80
    //% subcategory=Motors
    //% group="New style blocks"
    //% blockGap=8
    export function rotate(direction: BBRobotDirection, speed: number): void
    {
        if (direction == BBRobotDirection.Left)
        {
            move(BBMotor.Left, BBDirection.Reverse, speed);
            move(BBMotor.Right, BBDirection.Forward, speed);
        }
        else if (direction == BBRobotDirection.Right)
        {
            move(BBMotor.Left, BBDirection.Forward, speed);
            move(BBMotor.Right, BBDirection.Reverse, speed);
        }
    }

    /**
      * Rotate robot in direction at speed for milliseconds.
      * @param direction direction to spin
      * @param speed speed of motor between 0 and 100. eg: 60
      * @param milliseconds duration in milliseconds to spin for, then stop. eg: 400
      */
    //% blockId="BBRotatems" block="spin %direction|at speed %speed|for %milliseconds|(ms)"
    //% speed.min=0 speed.max=100
    //% weight=70
    //% subcategory=Motors
    //% group="New style blocks"
    //% blockGap=8
    export function rotatems(direction: BBRobotDirection, speed: number, milliseconds: number): void
    {
        rotate(direction, speed);
        basic.pause(milliseconds);
        stop(BBStopMode.Coast);
    }

    /**
      * Stop robot by coasting slowly to a halt or braking
      * @param mode Brakes on or off
      */
    //% blockId="BBstop" block="stop with %mode"
    //% weight=60
    //% subcategory=Motors
    //% group="New style blocks"
    //% blockGap=8
    export function stop(mode: BBStopMode): void
    {
        let stopMode = 0;
        if (mode == BBStopMode.Brake)
            stopMode = 1;
        getModel();
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
    //% blockId="BBMove" block="move %motor|motor(s) %direction|at speed %speed"
    //% weight=50
    //% speed.min=0 speed.max=100
    //% subcategory=Motors
    //% group="New style blocks"
    //% blockGap=8
    export function move(motor: BBMotor, direction: BBDirection, speed: number): void
    {
        speed = clamp(speed, 0, 100) * 10.23;
        setPWM(speed);
        let lSpeed = Math.round(speed * (100 - leftBias) / 100);
        let rSpeed = Math.round(speed * (100 - rightBias) / 100);
        if ((motor == BBMotor.Left) || (motor == BBMotor.Both))
        {
            if (direction == BBDirection.Forward)
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
        if ((motor == BBMotor.Right) || (motor == BBMotor.Both))
        {
            if (direction == BBDirection.Forward)
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
    //% blockId="BBBias" block="bias%direction|by%bias|%"
    //% bias.min=0 bias.max=80
    //% weight=40
    //% subcategory=Motors
    //% group="New style blocks"
    //% blockGap=8
    export function BBBias(direction: BBRobotDirection, bias: number): void
    {
        bias = clamp(bias, 0, 80);
        if (direction == BBRobotDirection.Left)
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
      * Drive motor(s) forward or reverse.
      * @param motor motor to drive.
      * @param speed speed of motor (-1023 to 1023). eg: 600
      */
    //% blockId="bitbot_motor" block="drive %motor|motor(s) at speed %speed"
    //% weight=80
    //% subcategory=Motors
    //% group="Old style blocks"
    //% blockGap=8
    export function motor(motor: BBMotor, speed: number): void
    {
        let speed0 = 0;
        let speed1 = 0;
        setPWM(Math.abs(speed));
        if (speed > 0)
        {
            speed0 = speed;
            speed1 = 0;
        }
        else
        {
            speed0 = 0;
            speed1 = 0 - speed;
        }
        if ((motor == BBMotor.Left) || (motor == BBMotor.Both))
        {
            if (getModel() == BBModel.Classic)
            {
                pins.analogWritePin(AnalogPin.P0, speed0);
                pins.analogWritePin(AnalogPin.P8, speed1);
            }
            else
            {
                pins.analogWritePin(AnalogPin.P16, speed0);
                pins.analogWritePin(AnalogPin.P8, speed1);
            }
        }

        if ((motor == BBMotor.Right) || (motor == BBMotor.Both))
        {
            if (getModel() == BBModel.Classic)
            {
                pins.analogWritePin(AnalogPin.P1, speed0);
                pins.analogWritePin(AnalogPin.P12, speed1);
            }
            else
            {
                pins.analogWritePin(AnalogPin.P14, speed0);
                pins.analogWritePin(AnalogPin.P12, speed1);
            }
        }
    }

    /**
      * Drive robot forward (or backward) at speed.
      * @param speed speed of motor between -1023 and 1023. eg: 600
      */
    //% blockId="bitbot_motor_forward" block="drive at speed %speed"
    //% speed.min=-1023 speed.max=1023
    //% weight=100
    //% subcategory=Motors
    //% group="Old style blocks"
    //% blockGap=8
    export function drive(speed: number): void
    {
        motor(BBMotor.Both, speed);
    }

    /**
      * Drive robot forward (or backward) at speed for milliseconds.
      * @param speed speed of motor between -1023 and 1023. eg: 600
      * @param milliseconds duration in milliseconds to drive forward for, then stop. eg: 400
      */
    //% blockId="bitbot_motor_forward_milliseconds" block="drive at speed %speed| for %milliseconds|(ms)"
    //% speed.min=-1023 speed.max=1023
    //% weight=95
    //% subcategory=Motors
    //% group="Old style blocks"
    //% blockGap=8
    export function driveMilliseconds(speed: number, milliseconds: number): void
    {
        drive(speed);
        basic.pause(milliseconds);
        stop(BBStopMode.Coast);
    }

    /**
      * Turn robot in direction at speed.
      * @param direction direction to turn.
      * @param speed speed of motor between 0 and 1023. eg: 600
      */
    //% blockId="bitbot_turn" block="spin %direction|at speed %speed"
    //% speed.min=0 speed.max=1023
    //% weight=90
    //% subcategory=Motors
    //% group="Old style blocks"
    //% blockGap=8
    export function driveTurn(direction: BBRobotDirection, speed: number): void
    {
        if (speed < 0)
            speed = 0;
        if (direction == BBRobotDirection.Left)
        {
            motor(BBMotor.Left, -speed);
            motor(BBMotor.Right, speed);
        }
        else if (direction == BBRobotDirection.Right)
        {
            motor(BBMotor.Left, speed);
            motor(BBMotor.Right, -speed);
        }
    }

    /**
      * Spin robot in direction at speed for milliseconds.
      * @param direction direction to turn.
      * @param speed speed of motor between 0 and 1023. eg: 600
      * @param milliseconds duration in milliseconds to turn for, then stop. eg: 400
      */
    //% blockId="bitbot_turn_milliseconds" block="spin %direction|at speed %speed| for %milliseconds|(ms)"
    //% speed.min=0 speed.max=1023
    //% weight=85
    //% subcategory=Motors
    //% group="Old style blocks"
    //% blockGap=8
    export function driveTurnMilliseconds(direction: BBRobotDirection, speed: number, milliseconds: number): void
    {
        driveTurn(direction, speed)
        basic.pause(milliseconds)
        stop(BBStopMode.Coast);
    }


}
