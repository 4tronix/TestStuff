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
    let PCA = 0x40;
    let initI2C = false;

    /**
      * Select Model of Robobit (Determines Pin usage)
      *
      * @param model Model of Robobit buggy. Mk1, Mk2, or Mk3
      */
    //% blockId="robobit_model" block="select 21Robobit model %model"
    //% weight=110
    export function select_model(model: RBModel): void {
        _model = model;
    }

    // Helper functions
    function initPCA(): void
    {
/*
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
*/
    }

}