{
  // Drive at 60% speedforward
  theta.robotGo(RXDirection.Forward, 60);
  basic.pause(1000);

  // Drive 40% speed reverse for 400 ms
  theta.robotGoms(RXDirection.Reverse, 40, 400);
  basic.pause(1000);

  // Spin: Drive 700 ms forward on left and reverse on right
  theta.motorMovems(RXMotor.Left, RXDirection.Forward, 60, 700);
  theta.motorMovems(RXMotor.Right, RXDirection.Reverse, 60, 700);
  basic.pause(1000);

  // Read sonar values in cm, inches and microSeconds
  basic.showNumber(theta.readSonar(RXPingUnit.Centimeters));
  basic.showNumber(theta.readSonar(RXPingUnit.Inches));
  basic.showNumber(theta.readSonar(RXPingUnit.MicroSeconds));

  // Set all leds to Red
  theta.ledsColor(0xFF0000);
  basic.pause(1000);

  // Clear all leds
  theta.ledClear();
  basic.pause(1000);

  // Set led at position 2 to Blue
  theta.setPixel(2, 0x0000FF);
  basic.pause(1000);

  // Show led rainbow
  theta.ledRainbow(true);
  basic.pause(1000);

  // Show led rainbow and shift
  theta.ledRainbow(true);
  theta.ledShift(true);
  basic.pause(1000);

  // Show led rainbow and rotate
  theta.ledRainbow(true);
  theta.ledRotate(true);
  basic.pause(1000);

  // Set brightness of leds
  theta.ledBrightness(40);
  theta.ledShow();
  basic.pause(1000);

  // Set the Manual/Automatic Update mode
  theta.setUpdateMode(RXMode.Manual);
  theta.setUpdateMode(RXMode.Auto);
  basic.pause(1000);

  // Turns Buzzer on, then Off
  theta.buzz(true);
  basic.pause(500);
  theta.buzz(false);
  basic.pause(1000);

  // Read Left, then Right Line Sensor values
  basic.showNumber(theta.readLine(RXLineSensor.Left));
  basic.pause(500);
  basic.showNumber(theta.readLine(RXLineSensor.Right));
  basic.pause(1000);

  // Read Left, then Right Light Sensor values
  basic.showNumber(theta.readLight(RXLightSensor.Left));
  basic.pause(500);
  basic.showNumber(theta.readLight(RXLightSensor.Right));
  basic.pause(1000);

  // Read Dial input value
  basic.showNumber(theta.readDial());
  basic.pause(1000);

  // Read Battery Voltage
  basic.showNumber(theta.readBattery());
  basic.pause(1000);

  // Write, then read 27 to EEROM position 13
  theta.writeEEROM(27, 13);
  basic.pause(500);
  basic.showNumber(theta.readEEROM(13));
  basic.pause(1000);

}
