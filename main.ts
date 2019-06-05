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
    let PCA = 0x40;	// i2c address of 4tronix Animoid servo controller
    let EEROM = 0x50;	// i2c address of EEROM
    let initI2C = false;
    let SERVOS = 0x06; // first servo address for start byte low
    let lLower = 57;	// distance from servo shaft to tip of leg/foot
    let lUpper = 46;	// distance between servo shafts
    let lLower2 = lLower * lLower;	// no point in doing this every time
    let lUpper2 = lUpper * lUpper;
    let gait: number[][][] = [];	// array of foot positions for each foot and each of 16 Beats
    let upDown: number[] = [];		// array of Up and down beat numbers for each foot
    let gInit = false;
    let radTOdeg = 180 / Math.PI;
    let servoOffset: number[] = [];

    let nBeats = 16;	// number of beats in a cycle
    let _height = 50;	// default standing height of lowered legs
    let _raised = 40;	// default height of raised legs
    let _stride = 80;	// total distance moved in one cycle
    let _offset = 20;	// forward-most point of leg
    let _delay = 20;	// ms to pause at end of each beat

    // Helper functions

    /**
      * Turn selected motor at speed.
      * @param motor motor to drive
      * @param speed speed of motor between 0 and 1023. eg: 600
      */
    //% blockId="rotate_motor" block="rotate 19 %motor| motor at speed %speed"
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



}