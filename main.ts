﻿/**
  * Enumeration of servos
  */
enum Servos
{
    FL_Hip,
    FL_Knee,
    RL_Hip,
    RL_Knee,
    RR_Hip,
    RR_Knee,
    FR_Hip,
    FR_Knee,
    Head,
    Tail
}

/**
  * Enumeration of limbs
  */
enum Limbs
{
    FrontLeft,
    RearLeft,
    RearRight,
    FrontRight
}

/**
  * Enumeration of servo enable states
  */
enum States
{
    Enable,
    Disable
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
 * Custom blocks
 */

//% weight=10 color=#e7660b icon="\uf188"
namespace Animoid
{
    let PCA = 0x40;	// i2c address of 4tronix Animoid servo controller
    let initI2C = false;
    let SERVOS = 0x06; // first servo address for start byte low
    let lLower = 57;	// distance from servo shaft to tip of leg/foot
    let lUpper = 46;	// distance between servo shafts
    let lLower2 = lLower * lLower;	// no point in doing this every time
    let lUpper2 = lUpper * lUpper;
    let gait: number[][][] = [];
    let initGait = false;
    let height = 30;	// default standing height

    // Helper functions

    /**
      * Enable/Disable Servos
      *
      * @param state Select Enabled or Disabled
      */
    //% blockId="enableServos" block="%state all 17 servos"
    //% weight=90
    export function enableServos(state: States): void
    {
        pins.digitalWritePin(DigitalPin.P16, state);
    }

    /**
      * Return servo number from name
      *
      * @param value servo name
      */
    //% blockId="getServo" block="%value"
    //% weight=80
    export function getServo(value: Servos): number
    {
        return value;
    }

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

	pins.digitalWritePin(DigitalPin.P16, 0);	// enable servos at start
    }

    /**
      * Initialise all servos to Angle=0
      */
    //% blockId="an_zeroServos"
    //% block
    export function zeroServos(): void
    {
        for (let i=0; i<16; i++)
            setServo(i, 0);
    }

    /**
      * Set Servo Position by Angle
      * @param servo Servo number (0 to 15)
      * @param angle degrees to turn servo (-90 to +90)
      */
    //% blockId="an_setServo" block="set servo %servo| to angle %angle"
    //% angle.min = -90 angle.max = 90
    //% weight = 70
    export function setServo(servo: number, angle: number): void
    {
        if (initI2C == false)
        {
            initPCA();
        }
        let i2cData = pins.createBuffer(2);
        // two bytes need setting for start and stop positions of the servo
        // servos start at SERVOS (0x06) and are then consecutive bloocks of 4 bytes
        let start = 0;
        let stop = 369 + angle * 275 / 90;

        i2cData[0] = SERVOS + servo*4 + 0;	// Servo register
        i2cData[1] = 0x00;			// low byte start - always 0
        pins.i2cWriteBuffer(PCA, i2cData, false);

        i2cData[0] = SERVOS + servo*4 + 1;	// Servo register
        i2cData[1] = 0x00;			// high byte start - always 0
        pins.i2cWriteBuffer(PCA, i2cData, false);

        i2cData[0] = SERVOS + servo*4 + 2;	// Servo register
        i2cData[1] = (stop & 0xff);		// low byte stop
        pins.i2cWriteBuffer(PCA, i2cData, false);

        i2cData[0] = SERVOS + servo*4 + 3;	// Servo register
        i2cData[1] = (stop >> 8);			// high byte stop
        pins.i2cWriteBuffer(PCA, i2cData, false);
    }

    /**
      * Get numeric value of Limb
      * @param limb name of limb eg FrontLeft
      */
    //% blockId="an_limbs" block=%limb
    function limbNum(limb: Limbs): number
    {
        return limb;
    }

    /**
      * Set Position of Foot in mm from hip servo shaft
      * Inverse kinematics from learnaboutrobots.com/inverseKinematics.htm
      * @param limb Determines which limb to move. eg. FrontLeft
      * @param xpos Position on X-axis in mm
      * @param height Height of hip servo shaft above foot. eg: 60
      */
    //% blockId="setLimb" block="set %limb=an_limbs| to position %xpos|(mm) height %height|(mm)"
    //% weight = 60
    export function setLimb(limb: number, xpos: number, height: number): void
    {
        let B2 = xpos*xpos + height*height;	// from: B2 = Xhand2 + Yhand2
        let q1 = Math.atan2(height, xpos);	// from: q1 = ATan2(Yhand/Xhand)
        let q2 = Math.acos((lUpper2 - lLower2 + B2) / (2 * lUpper * Math.sqrt(B2)));
        let hip = Math.floor((q1 + q2)*180/Math.PI);	// convert from radians to integer degrees
        let k = Math.acos((lUpper2 + lLower2 - B2) / (2 * lUpper * lLower));
        let knee = Math.floor(k*180/Math.PI);
        //basic.showNumber(hip);
        //basic.showNumber(knee);
	if (limbNum(limb) < 2)
        {
            hip = hip - 90;
            knee = knee - 90;
        }
        else
        {
            hip = 90 - hip;
            knee = 90 - knee;
        }
        setServo(<number>limb * 2, hip);
        setServo(limbNum(limb)*2+1, knee);
    }

}