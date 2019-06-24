/**
  * Enumeration of motors
  */
enum BCMotor
{
    //% block="FrontLeft"
    FL,
    //% block="FrontRight"
    FR,
    //% block="RearRight"
    RR,
    //% block="RearLeft"
    RL
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
    let PCA = 0x40;	// i2c address of 4tronix BitCopter PWM controller
    let initI2C = false;
    let PWM0 = 0x06; // first address for start byte low on PWM channel 0

    // Helper functions

    // initialise the PWM driver
    function initPCA(): void
    {

        let i2cData = pins.createBuffer(2);
        initI2C = true;

        i2cData[0] = 0;		// Mode 1 register
        i2cData[1] = 0x10;	// put to sleep
        pins.i2cWriteBuffer(PCA, i2cData, false);

        i2cData[0] = 0xFE;	// Prescale register
        i2cData[1] = 101;	// set to 60 Hz
        pins.i2cWriteBuffer(PCA, i2cData, false);

        i2cData[0] = 0;		// Mode 1 register
        i2cData[1] = 0x81;	// Wake up
        pins.i2cWriteBuffer(PCA, i2cData, false);

        for (let pwm=0; pwm<4; pwm++)
        {
            i2cData[0] = PWM0 + pwm*4 + 0;	// PWM register
            i2cData[1] = 0x00;			// low byte start - always 0
            pins.i2cWriteBuffer(PCA, i2cData, false);

            i2cData[0] = PWM0 + pwm*4 + 1;	// PWM register
            i2cData[1] = 0x00;			// high byte start - always 0
            pins.i2cWriteBuffer(PCA, i2cData, false);
        }
    }

    /**
      * Turn selected motor at speed.
      * @param motor motor to drive
      * @param speed speed of motor between 0 and 1023. eg: 600
      */
    //% blockId="rotate_motor" block="rotate 24 %motor| motor at speed %speed"
    //% weight=110
    export function rotate(motor: BCMotor, speed: number): void
    {
        turnMotor(motorNum(motor), speed);
    }

    /**
      * Get numeric value of motor
      */
    function motorNum(motor: BCMotor): number
    {
        return motor;
    }

    function turnMotor(motor: number, speed: number): void
    {
        if (initI2C == false)
        {
            initPCA();
        }
        // two bytes need setting for start and stop positions of the PWM period
        // PWM drivers start at PWM0 (0x06) and are then consecutive blocks of 4 bytes
        // the start position (always 0x00) is set during init for all

        let i2cData = pins.createBuffer(2);
        let start = 0;
        let stop = speed * 4;

        i2cData[0] = PWM0 + motor*4 + 2;	// Servo register
        i2cData[1] = (stop & 0xff);		// low byte stop
        pins.i2cWriteBuffer(PCA, i2cData, false);

        i2cData[0] = PWM0 + motor*4 + 3;	// Servo register
        i2cData[1] = (stop >> 8);		// high byte stop
        pins.i2cWriteBuffer(PCA, i2cData, false);
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