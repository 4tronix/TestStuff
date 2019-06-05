/**
  * Enumeration of motors
  */
enum BCMotor
{
    //% block="FrontLeft"
    FL,
    //% block="FrontRight"
    FR,
    //% block="RearLeft"
    RL,
    //% block="RearRight"
    RR
}

/**
  * Enumeration of directions
  */
enum BCDirection
{
    //% block="left"
    Left,
    //% block="right"
    Right,
    //% block="forward"
    Forward,
    //% block="reverse"
    Reverse
}

/**
 * Ping unit for sensor
 */
enum BCPingUnit
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
 * Custom blocks
 */

//% weight=10 color=#e7660b icon="\uf1cd"
namespace BitCopter
{
    // Helper functions

    /**
      * Turn selected motor at speed.
      * @param motor motor to drive
      * @param speed speed of motor between 0 and 1023. eg: 600
      */
    //% blockId="rotate_motor" block="rotate 20 %motor| motor at speed %speed"
    //% weight=110
    export function rotate(motor: BCMotor, speed: number): void
    {
        turnMotor(motor, speed);
    }


    function turnMotor(motor: BCMotor, speed: number): void
    {
        let motorPin = AnalogPin.P12;
        switch (motor)
        {
            case BCMotor.FR: motorPin = AnalogPin.P13; break;
            case BCMotor.RR: motorPin = AnalogPin.P14; break;
            case BCMotor.RL: motorPin = AnalogPin.P15; break;
        //    default: motorPin = AnalogPin.P12;
        }
        pins.analogWritePin(motorPin, speed);
    }

    /**
    * Read height from sonar module
    *
    * @param unit desired conversion unit
    */
    //% subcategory=Sensors
    //% group=Sensors
    //% blockId="height_sonar" block="read sonar as %unit"
    //% weight=90
    export function sonar(unit: BCPingUnit): number
    {
        // send pulse
        let trig = DigitalPin.P15;
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
            case BCPingUnit.Centimeters: return d / 58;
            case BCPingUnit.Inches: return d / 148;
            default: return d;
        }
    }



}