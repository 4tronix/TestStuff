/**
  * Enumeration of motors.
  */
enum RBMotor {
    //% block="left"
    Left,
    //% block="right"
    Right,
    //% block="all"
    All
}

/**
  * Enumeration of directions.
  */
enum RBRobotDirection {
    //% block="left"
    Left,
    //% block="right"
    Right
}

/**
  * Enumeration of line sensors.
  */
enum RBLineSensor {
    //% block="left"
    Left,
    //% block="right"
    Right
}


/**
  * Enumeration of Robobit Models and Options
  */
enum RBModel {
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
 * Ping unit for sensor
 */
enum RBPingUnit {
    //% block="μs"
    MicroSeconds,
    //% block="cm"
    Centimeters,
    //% block="inches"
    Inches
}

/**
 * Custom blocks
 */

//% weight=10 color=#e7660b icon="\uf188"
namespace Animoid {

    let _model: RBModel;
    let larsson: number;
    let scandir: number;
    let ledCount=8;

    /**
      * Select Model of Robobit (Determines Pin usage)
      *
      * @param model Model of Robobit buggy. Mk1, Mk2, or Mk3
      */
    //% blockId="robobit_model" block="select 18Robobit model %model"
    //% weight=110
    export function select_model(model: RBModel): void {
        _model = model;
    }

    /**
      * Drive robot forward (or backward) at speed.
      *
      * @param speed speed of motor between -1023 and 1023.
      */
    //% subcategory=Motors
    //% group=Motors
    //% blockId="robobit_motor_forward" block="drive at speed %speed"
    //% speed.min=-1023 speed.max=1023
    //% weight=110
    export function drive(speed: number): void
    {
        setPWM(speed);
        motor(RBMotor.All, speed);
    }

    /**
      * Drive robot forward (or backward) at speed for milliseconds.
      *
      * @param speed speed of motor between -1023 and 1023.
      * @param milliseconds duration in milliseconds to drive forward for, then stop.
      */
    //% subcategory=Motors
    //% group=Motors
    //% blockId="robobit_motor_forward_milliseconds" block="drive at speed %speed| for milliseconds %milliseconds"
    //% speed.min=-1023 speed.max=1023
    //% weight=131
    export function driveMilliseconds(speed: number, milliseconds: number): void
    {
        drive(speed);
        basic.pause(milliseconds);
        drive(0);
    }

    /**
      * Turn robot in direction at speed.
      *
      * @param direction direction to turn.
      * @param speed speed of motor between 0 and 1023.
      */
    //% subcategory=Motors
    //% group=Motors
    //% blockId="robobit_turn" block="turn in direction %direction|speed %speed"
    //% speed.min=0 speed.max=1023
    //% weight=109
    export function driveTurn(direction: RBRobotDirection, speed: number): void {
        if (speed < 0) speed = 0;

        if (direction == RBRobotDirection.Left) {
            motor(RBMotor.Left, -speed);
            motor(RBMotor.Right, speed);
        } else if (direction == RBRobotDirection.Right) {
            motor(RBMotor.Left, speed);
            motor(RBMotor.Right, -speed);
        }
    }

    /**
      * Turn robot in direction at speed for milliseconds.
      *
      * @param direction direction to turn.
      * @param speed speed of motor between 0 and 1023.
      * @param milliseconds duration in milliseconds to turn for, then stop.
      */
    //% subcategory=Motors
    //% group=Motors
    //% blockId="robobit_turn_milliseconds" block="turn in direction %direction|speed %speed| for milliseconds %milliseconds"
    //% speed.min=0 speed.max=1023
    //% weight=130
    export function driveTurnMilliseconds(direction: RBRobotDirection, speed: number, milliseconds: number): void {
        driveTurn(direction, speed)
        basic.pause(milliseconds)
        motor(RBMotor.All, 0)
    }

    /**
      * Drive motor(s) forward or reverse.
      *
      * @param motor motor to drive.
      * @param speed speed of motor
      */
    //% subcategory=Motors
    //% group=Motors
    //% blockId="robobit_motor" block="drive motor %motor|speed %speed"
    //% weight=100
    export function motor(motor: RBMotor, speed: number): void {
        let forward = (speed >= 0);

        if (speed > 1023) {
            speed = 1023;
        } else if (speed < -1023) {
            speed = -1023;
        }

        let realSpeed = speed;
        if (!forward) {
            if (realSpeed >= -200)
                realSpeed = (realSpeed * 19) / 6;
            else if (realSpeed >= -400)
                realSpeed = realSpeed * 2;
            else if (realSpeed >= -600)
                realSpeed = (realSpeed * 3) / 2;
            else if (realSpeed >= -800)
                realSpeed = (realSpeed * 5) / 4;
            realSpeed = 1023 + realSpeed; // realSpeed is negative!
        }

        if ((motor == RBMotor.Left) || (motor == RBMotor.All)) {
            pins.analogWritePin(AnalogPin.P0, realSpeed);
            pins.digitalWritePin(DigitalPin.P8, forward ? 0 : 1);
        }

        if ((motor == RBMotor.Right) || (motor == RBMotor.All)) {
            pins.analogWritePin(AnalogPin.P1, realSpeed);
            pins.digitalWritePin(DigitalPin.P12, forward ? 0 : 1);
        }
    }

    /**
      * Read line sensor.
      *
      * @param sensor Line sensor to read.
      */
    //% subcategory=Sensors
    //% group=Sensors
    //% blockId="robobit_read_line" block="read line sensor %sensor"
    //% weight=90
    export function readLine(sensor: RBLineSensor): number {
        if (sensor == RBLineSensor.Left)
	{
	    if (_model == RBModel.Mk3)
            	return pins.digitalReadPin(DigitalPin.P16);
	    else
            	return pins.digitalReadPin(DigitalPin.P11);
        } else
	{
	    if (_model == RBModel.Mk3)
            	return pins.digitalReadPin(DigitalPin.P14);
	    else
            	return pins.digitalReadPin(DigitalPin.P5);
        }
    }


    /**
    * Read distance from sonar module connected to accessory connector.
    *
    * @param unit desired conversion unit
    */
    //% subcategory=Sensors
    //% group=Sensors
    //% blockId="robobit_sonar" block="read sonar as %unit"
    //% weight=7
    export function sonar(unit: RBPingUnit): number {
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

        switch (unit) {
            case RBPingUnit.Centimeters: return d / 58;
            case RBPingUnit.Inches: return d / 148;
            default: return d;
        }
    }

    /**
      * Adjust opening of Claw attachment
      *
      * @param degrees Degrees to open Claw.
      */
    //% subcategory=Sensors
    //% group=Sensors
    //% blockId="robobit_set_claw" block="Set claw %degrees"
    //% weight=90
    export function setClaw(degrees: number): void
    {
        pins.servoWritePin(AnalogPin.P13, Math.clamp(0, 80, degrees))
    }

    function setPWM(speed: number): void
    {
        pins.analogSetPeriod(AnalogPin.P0, 40000);
    }


}