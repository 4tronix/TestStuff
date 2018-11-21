/**
  * Enumeration of servos
  */
enum SVServos {
    //% block="FL_Hip"
    0,
    //% block="FL_Knee"
    1,
    //% block="RL_Hip"
    2,
    //% block="RL_Knee"
    3,
    //% block="RR_Hip"
    4,
    //% block="RR_Knee"
    5,
    //% block="FR_Hip"
    6,
    //% block="FR_Knee"
    7
}

/**
  * Enumeration of directions.
  */
enum SVRobotDirection {
    //% block="left"
    Left,
    //% block="right"
    Right
}


/**
 * Custom blocks
 */

//% weight=10 color=#e7660b icon="\uf709"
namespace servos {

    let PCA = 0x40;
    let initI2C = false;
    let SERVOS = 0x06; // first servo address for start byte low

// Helper functions
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
    }


    /**
      * Set Servo Position
      *
      * @param servo Servo number (0 to 15)
      * @param angle degrees to turn servo (-90 to +90)
      */
    //% blockId="setServo" block="set servo %servo| to angle %angle"
    //% weight = 60
    export function setServo(servo: number, angle: number): void
    {
        if (! initI2C)
            initPCA();
        let i2cData = pins.createBuffer(2);
        // two bytes need setting for start and stop positions of the servo
        // servos start at SERVOS (0x06) and are then consecutive bloocks of 4 bytes
        let start = 0;
        let stop = 175 + ((angle + 90) * 400) / 180;

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


}