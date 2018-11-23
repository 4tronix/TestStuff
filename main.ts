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

    /**
      * Select Model of Robobit (Determines Pin usage)
      *
      * @param model Model of Robobit buggy. Mk1, Mk2, or Mk3
      */
    //% blockId="robobit_model" block="select 19Robobit model %model"
    //% weight=110
    export function select_model(model: RBModel): void {
        _model = model;
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