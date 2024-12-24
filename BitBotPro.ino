// BitBot Pro Release Code v1.1
// Incorporate PID control loop for motors
// Add for this release, maximum target speed depends on battery voltage, improved end of movement slowdown, more variable GET and SET-able
// Supports moving selected distances
// Supports moving in arcs at selected radius and angle
// Supports 3 analog line sensors, with indicators and calibration function

#include "FastLED.h"
#include <Wire.h>
#include <OneWire.h>
#include <Servo.h>
#include <EEPROM.h>

#define DEBUG false
#define CORRECT true

#define BOARD_REV     6   // Board ID for BitBot Pro is 6
#define FIRMWARE_REV  11  // Firmware Revision. First release was 10

// Motors
#define M1A 5
#define M1B 9
#define M2A 6
#define M2B 10
#define mLeft  0
#define mRight 1
#define mBoth  2

// Wheel Sensors
#define WSL 2
#define WSR 3

// Line Sensors
#define LNEN 12
#define LNL A0
#define LNR A1
#define LNC A3

// PSU Monitor
#define PSUPIN A2

// Power Indicator
#define POWER 13

// Line Sensor Indicators
#define LNLS 11
#define LNRS 4
#define LNCS 8
#define AUTO 3
#define defaultThreshold 100
#define defaultHysteresis 10
int lineThreshold[] = {defaultThreshold, defaultThreshold, defaultThreshold};
int lineHysteresis[] = {defaultHysteresis, defaultHysteresis, defaultHysteresis};
int autoIndicate =true;

// Light Sensors
#define LTL A6
#define LTR A7

// Wheel Encoder and PID variables
#define loopRate 20 // in ms
uint8_t startPWMmin = 60; // minimum starting PWM value - so motors start properly
uint8_t startPWMmax = 100; // maximum starting PWM value - so wheels don't slip
#define minPWM 50.0
#define maxPWM 255.0
long countL, countR; // counts of Hall effect pulses per sampletime
long totalCountL, totalCountR; // total count of pulses since start of movement
long publicCountL=0, publicCountR=0;
long lastCountL, lastCountR;
long targetCountL, targetCountR; // target total of pulses so far = tarSpeed * number of loops
double targetSpeedL, targetSpeedR; // target speed in pulses per sampletime
bool targetFlagL, targetFlagR;  // flag set true after speed is halved near end of movement
double actualSpeedL, actualSpeedR; // actual current speed in pulses per sampletime
double maxDiff, maxCountDiff;
double lastErrorSpeedL, lastErrorSpeedR; // previous actual speeds
int pwmL=120, pwmR=120; // applied motor pwm values (0..255)
double DpwmL=pwmL, DpwmR=pwmR;
unsigned long lastTime, now;
int encoderErrorL=0, encoderErrorR=0;
int trackErrorL=0, trackErrorR=0;
double speedRatio;
bool sumErrors=false;

double targetL, targetR;
bool doneL=false, doneR=false;
int dirL=1, dirR=1;   // increments for public wheel counters

// 150rpm Motor. Gear Ratio 100:1
#define defaultPulsesPerCm  103.3 // Measured v0.2 was 103.6
#define defaultPulsesPerDegree 9.7 // Measured v0.2 was 9.55
#define defMaxSpeed 42 // in pulses per ms
int maxSpeed = defMaxSpeed;
#define minSpeed 10 // in pulses per ms. Speed on full alkaline batteries
double pulsesPerCm = defaultPulsesPerCm;
double pulsesPerDegree = defaultPulsesPerDegree;

// Constants calculated from wheel measurements
#define PI 3.14159
const double halfWheelbase = ((pulsesPerDegree * 360) / (pulsesPerCm * PI)) / 2;
const double arcConst = (2 * PI * pulsesPerCm) / 360;
long stopThreshold = (pulsesPerCm * 0.4);  // was 0.5  Stop with 4mm remaining
long brakeThreshold = (pulsesPerCm * 2.0);   // was 5.0  Brake with 20mm remaining
int brakingSpeed = 20;

//------
long stopThreshL = stopThreshold;
long stopThreshR = stopThreshold;

// PIDC Constants
  // P = error in current speed
  // I = error in total distance (pulses) covered vs expected distance at target speed
  // D = change in error since last loop
  // C = difference in current speed between the two wheels
#define defKp 0.5  // Speed error. Was 0.1, 0.3
#define defKi 0.0  // Current count error. Was 0.0
#define defKd 0.1  // Delta speed error. Was 0.1
#define defKc 0.7  // Speed difference. Was 0.5

double Kp=defKp, Ki=defKi, Kd=defKd, Kc=defKc;
bool PIDenable = true;  // default value is always true: run with PID control

// I2C Microbit Interface data
// Use same registers and parameters as Theta, then extend for the new features of BitBot Pro
/*
Write Only Registers
--------------------
Register  Name      Type  Values
0   Fireled_Data    4 Bytes 0:Pixel ID, 1:Red, 2:Green, 3:Blue
1   Set Brightness  Byte  0..255. Scaled max brightness (default is 40)
2   Update Pixels   Byte  dummy value - forces updating of neopixels
3   IO_0_Config     Byte  0: Digital In, 1:: Digital Out, 2: PWM, 3: Servo
4   IO_0_Config     Byte  0: Digital In, 1:: Digital Out, 2: PWM, 3: Servo
5   IO_0_Config     Byte  0: Digital In, 1:: Digital Out, 2: PWM, 3: Servo
6   IO_0_Config     Byte  0: Digital In, 1:: Digital Out, 2: PWM, 3: Servo
9   UpdateMode      Byte  0: Digital, 1:Analog, 2:DS18B20  (NB. 0x80 is Digital input with pullup)
10  Shift_LEDs      Byte  Direction
11  Rotate_LEDs     Byte  Direction
12  Rainbow         Byte  Direction
13  IO_0_Data       Byte  Output Data
14  IO_1_Data       Byte  Output Data
15  IO_2_Data       Byte  Output Data
16  IO_3_Data       Byte  Output Data
20  Reset           Byte  dummy value - resets all values to initial state

Read Only Registers - These are WORDs
-------------------------------------
Register  Name  Type  Values
0 Revision      Word  Low Byte: Firmware Build, High Byte: PCB Revision
1 Line_Left     Word  0..1023 for Analog Line sensor
2 Line_Right    Word  0..1023 for Analog Line sensor
3 Light_Left    Word  0..1023 for Analog Line sensor
4 Light_Right   Word  0..1023 for Analog Line sensor
5 Dial          Word  0..1023 for Dial input
6 PSU_Voltage   Word  PSU Voltage (mV)
7  IO_0_Data    Word  Input Data
8  IO_1_Data    Word  Input Data
9  IO_2_Data    Word  Input Data
10 IO_3_Data    Word  Input Data
100 onwards     Word  Flash memory. Read register 100 = Flash address 0 & 1 (16 bits); register 101 = 2 & 3

Data Values for Output Data Registers
--------------------------------------
Mode  Name    Type    Values
0     On/Off  Byte    0 is OFF, 1 is ON
1     PWM     Byte    0 to 100 percentage of ON time
2     Servo   Byte    -100 to + 100 Position in degrees

*/

// I2C Command Set
#define FIRELED_DATA  0
#define SETBRIGHT     1
#define UPDATENOW     2
#define IO_0_CFG      3
#define IO_1_CFG      4
#define IO_2_CFG      5
#define IO_3_CFG      6
#define DUMMY_0       7
#define DUMMY_1       8
#define UPDATEMODE    9
#define SHIFTLEDS    10   // direction, selected arm(s)
#define ROTATELEDS   11   // direction, selected arm(s)
#define RAINBOW      12   // direction, selected arm(s)
#define SETPIXEL     13
#define IO_0_DATA    14
#define IO_1_DATA    15
#define IO_2_DATA    16
#define IO_3_DATA    17
#define RESET        20

// BitBot Pro New Commands
#define STOP        21  // Coast or Brake
#define DRIVE       22  // Speed +/- 100%
#define SPIN        23  // Speed +/- 100%
#define DRIVEDIST   24  // Speed, Distance (cm)
#define SPINANGLE   25  // Speed, Angle (degrees)
#define ARC         26  // Speed, Radius
#define ARCANGLE    27  // Speed, Radius, Angle
#define DIRECTMODE  28  // Speed, Motor. For compatability with older independent motor settings
#define INDICATOR   29  // Indicator, Value.  Set/Clear left or right idicator
#define SETTHRESH   30  // Threshold, Hysteresis
#define PIDENABLE   31  // 0/1 is disable/enable
#define LINECALIB   32  // Start only (no params)
#define RESETWHEEL  33  // Left, Right, Both
#define SETTRIMS    34  // distance and angle trims +/- 100
#define SETPIDCON   35  // set the PID constants (used for debugging)
#define SUMERRORS   36  // disable/enable carrying PID errors to next command
#define CLRERRORS   37  // Clear the PID tracking error
#define STOPBRAKE   38  // Set Stop threshold in tenths of pulsesPerCm
#define STARTPWM    39  // Starting PWM min and max values

#define STARTFLASH  50 // Commands 50 or higher used as address of EEROM location
#define i2cACK     0x55 // finished moving acknowledgement
#define i2cNAK     0xaa
#define COAST      false
#define BRAKE      true

// System Allocation of EEPROM from 0 to STARTFLASH-1
#define LINEVALS  0   // 24 bytes used for line threshholds and hysteresis and their complements
#define TRIMDIST  24  // 2 bytes for distance trim and its complement
#define TRIMANGLE 26  // 2 bytes for angle trim and its complement

// Arm numbering
#define ARMBOTH  0
#define ARMLEFT  1
#define ARMRIGHT 2

// Input Config Values
#define CFGDIG    0
#define CFGDIGPU  1

// Output Config Values
#define CFGONOFF  2
#define CFGPWM    3
#define CFGSERVO  4

// Fireleds
#define LEDPIN 7
#define NUMLEDS 12
#define BRIGHTNESS 40
CRGB leds[NUMLEDS];
CRGB ledSave[NUMLEDS];
bool doShow = false;
byte updateMode = 1;  // LED update mode
bool microbit = false;

// byte command[10];
#define MAXBUF 50 // circular buffer for incoming commands
byte cmdBuf[MAXBUF+1];
int wrIdx = 0, rdIdx = 0; // write and read pointers to circular buffer

// ATMega I/O Pins
#define NUMIO 4
byte IOPins[NUMIO] = {3, 4, 5, 6}; // I/O pins
byte IOConfigs[NUMIO] = {0, 0, 0, 0};  // 0: Digital In, 1:: Digital Out, 2: PWM, 3: Servo
Servo servos[NUMIO];  // every output is potentially a servo

// PWM runs from 0 to 100 with 0 being fully OFF and 100 being fully ON
byte pwm[NUMIO] = {0, 0, 0, 0};  // array of PWM values, one value for each motor/output. Value is the point in the cycle that the PWM pin is switched OFF, with it being switch ON at 0. 100 means always ON: 0 means always OFF
byte pwmcount = 0;

int inputValues[STARTFLASH]; // store analog input values (words) including Version, LineLeft, LineRight, LightLeft, LightRight, Dial, PSU
// input channels - Note that these changed for rev 10 firmware
#define VERREV    0
#define DLINEL    1
#define DLINER    2
#define DLINEC    3
#define ALINEL    4
#define ALINER    5
#define ALINEC    6
#define LIGHTL    7
#define LIGHTR    8
#define PSU       9
#define ACKNAK   20
#define LPULSEL  21
#define LPULSEH  22
#define RPULSEL  23
#define RPULSEH  24
#define LASTERRL 25
#define LASTERRR 26

// I2C
int i2cAddress = 0x22;
byte inputChannel = 0; // selected reading channel. Set back to 0 after every read

void setup()
{
  if (DEBUG)
  {
    Serial.begin(115200);
    Serial.println("Starting...");
  }
  setMaxSpeed();
  cmdBuf[0] = 0;
  pinMode(LNLS, OUTPUT);
  pinMode(LNRS, OUTPUT);
  pinMode(LNCS, OUTPUT);
  pinMode(LNEN, OUTPUT);
  pinMode(M1A, OUTPUT);
  pinMode(M1B, OUTPUT);
  pinMode(M2A, OUTPUT);
  pinMode(M2B, OUTPUT);
  pinMode(POWER, OUTPUT);
  digitalWrite(POWER, HIGH);
  attachInterrupt(0, ISR_Left, CHANGE);  // Interrupt 0 is Pin 2
  attachInterrupt(1, ISR_Right, CHANGE); // Interrupt 1 is Pin 3

  Wire.begin(i2cAddress);         // join i2c bus with defined address
  Wire.onRequest(requestEvent);   // register event
  Wire.onReceive(receiveEvent);   // register wire.write interrupt event
  FastLED.addLeds<WS2812B, LEDPIN, GRB>(leds, NUMLEDS);
  FastLED.setBrightness(BRIGHTNESS);
  resetAll();
  loadCalibration();
  loadTrims();
  delay(1000);
  splash();
}

void setMaxSpeed()
{
  int volt = ((unsigned int)(analogRead(PSUPIN)) * 65) / 100; // convert to hundredths of a volt
  maxSpeed = (int)(volt/10) - 4;  // adjust the maximum speed for PID, dependent on battery level
  if(DEBUG)
    Serial.println("Volts: " + String(volt) + " Max Speed: " + String(maxSpeed));
}

// Introduction splash screen - LEDs display
void splash()
{
  if (!microbit)
  {
    setAll(255,0,0);
    delay(250);
    setAll(0,255,0);
    delay(250);
    setAll(0,0, 255);
    delay(250);
    allOff();
  }
}

int loopCount = 0;
void loop()
{
  while(cmdBuf[rdIdx] > 0)
    doCommand();
  readInputs();
  if(++loopCount > 100)
  {   // do rare things in here. Previously included the doShow
    loopCount = 0;
  }
  if (doShow)
  {
    FastLED.show();
    doShow = false;
  }
  delay(1);
}

byte pVal[10];

void gPop(byte count) // grab next n values from stack into linear array - so we know what order they come in!
{
  for(int i=0; i<count; i++)
    pVal[i] = pop();
}

void doCommand()
{
  int cmd = cmdBuf[rdIdx];
  //command[0] = 0;
  if(cmd > 0)
  {
    pop();
    if(DEBUG)
      Serial.println("DoCommand: " + String(cmd) + ": " + String(cmdBuf[rdIdx]) + "/" + String(cmdBuf[rdIdx+1]) + "/" + String(cmdBuf[rdIdx+2]) + "/" + String(cmdBuf[rdIdx+3]) + "/" + String(cmdBuf[rdIdx+4]));
    if (cmd >= STARTFLASH)
      EEPROM.update(cmd - STARTFLASH, pop());
    else switch (cmd) // can simply pop() single values, but multiple values should be linearised with gPop()
    {
      case SETPIXEL: gPop(5); setPixel(pVal[0], pVal[1], pVal[2], pVal[3], pVal[4]); break;
      case SETBRIGHT: FastLED.setBrightness(pop()); break;
      case UPDATENOW: doShow = true; break;
      case UPDATEMODE: updateMode = pop(); break;
      case RESET: resetAll(); break;
      case SHIFTLEDS: gPop(2); shiftLEDs(pVal[0], pVal[1]); break;
      case ROTATELEDS: gPop(2); rotateLEDs(pVal[0], pVal[1]); break;
      case RAINBOW: gPop(2); setRainbow(pVal[0], pVal[1]); break;
      case DRIVE: drive(pop()); break;
      case SPIN: spin(pop()); break;
      case STOP: allStop(pop()); break;
      case DRIVEDIST: motionStart(); gPop(3); driveDistance(pVal[0], mWord(pVal[1], pVal[2])); motionStop(); break;
      case SPINANGLE: motionStart(); gPop(3); spinAngle(pVal[0], mWord(pVal[1], pVal[2])); motionStop(); break;
      case ARC: gPop(3); arc(pVal[0], mWord(pVal[1], pVal[2]), 0); break;
      case ARCANGLE: motionStart(); gPop(5); arc(pVal[0], mWord(pVal[1], pVal[2]), mWord(pVal[3], pVal[4])); motionStop(); break;
      case DIRECTMODE: gPop(3); driveDirect(pVal[0], pVal[1], pVal[2]); break;
      case INDICATOR: gPop(2); setIndicator(pVal[0], pVal[1]); break;
      case SETTHRESH: gPop(4); setThreshold(mWord(pVal[0], pVal[1]), mWord(pVal[2], pVal[3])); break;
      case PIDENABLE: PIDenable = (pop() == 1); break;
      case LINECALIB: motionStart(); pop(); calibrateSensors(); motionStop(); break;
      case RESETWHEEL: resetWheelSensors(pop()); break;
      case SETTRIMS: gPop(2); trimWheelSensors(pVal[0], pVal[1]); break;
      case SETPIDCON: gPop(4); setPIDConstants(pVal[0], pVal[1], pVal[2], pVal[3]); break;
      case SUMERRORS: setSumErrors(pop()); break;
      case CLRERRORS: pop(); clearSumErrors(); break;
      case STOPBRAKE: gPop(3); setStopBrake(pVal[0], pVal[1], pVal[2]); break;
      case STARTPWM: gPop(2); setStartPWM(pVal[0], pVal[1]); break;
    }
  }
}

byte pop() // get next value from stack. Could be command or data  value
{
  byte rval = cmdBuf[rdIdx++];
  if(rdIdx > MAXBUF)
    rdIdx = 0;
  return rval;
}

int mWord(byte LSB, int8_t MSB)
{
  int rval = (int)((MSB<<8) + LSB);
  return rval;
}

#define NUMSENSORS 3
int lineState[NUMSENSORS];
int lineMin[NUMSENSORS];
int lineMax[NUMSENSORS];
int lineCount[NUMSENSORS];

void calibrateSensors()
{
  saveFireLeds();
  showFireLeds(255,0,0);  // set indication LEDs to Red
// wait for all sensors on White. Set to Orange when done
  clearStates();
  while(true)
  {
    checkWhite(0, analogRead(LNL), LNLS);
    checkWhite(1, analogRead(LNR), LNRS);
    checkWhite(2, analogRead(LNC), LNCS);
    if((lineState[0] + lineState[1] + lineState[2]) == 0)
      break;
    delay(10);
  }
  showFireLeds(255,80,0);
  // each sensor to go from White to Black n times. Set to Green when done
  // track min and max values
  clearStates();
  while(true)
  {
    checkState(0, analogRead(LNL), LNLS);
    checkState(1, analogRead(LNR), LNRS);
    checkState(2, analogRead(LNC), LNCS);
    if(DEBUG)
      Serial.println();
    if((lineState[0] + lineState[1] + lineState[2]) == 30)
      break;
    delay(10);
  }
  showFireLeds(0,255,0);
  // now save thresholds etc..
  for (int i=0; i<NUMSENSORS; i++)
  {
    lineThreshold[i] = (lineMax[i] + lineMin[i]) >> 1;
    lineHysteresis[i] = (lineMax[i] - lineMin[i]) >> 4;
  }
  saveCalibration();
  if(DEBUG)
  {
    Serial.println("Thresholds " + String(lineThreshold[0]) + "/" + String(lineThreshold[1]) + "/" + String(lineThreshold[2]));
    Serial.println("Hystereses " + String(lineHysteresis[0]) + "/" + String(lineHysteresis[1]) + "/" + String(lineHysteresis[2]));
  }
  delay(2000);
  restoreFireLeds();
}

void saveFireLeds()
{
  for(int i=0; i<NUMLEDS; i++)
    ledSave[i] = leds[i];
  //allOff();
}

void restoreFireLeds()
{
  for(int i=0; i<NUMLEDS; i++)
    leds[i] = ledSave[i];
  FastLED.show();
}

void showFireLeds(int r, int g, int b)
{
  leds[4] = CRGB(r, g, b);
  leds[5] = CRGB(r, g, b);
  leds[10] = CRGB(r, g, b);
  leds[11] = CRGB(r, g, b);
  FastLED.show();
}

void saveCalibration()
{
  for(int i=0; i<NUMSENSORS; i++) // i is WORD address, not bytes
  {
    saveWord(i, lineThreshold[i]);
    saveWord(i + (NUMSENSORS<<1), -lineThreshold[i]);
    saveWord(i + NUMSENSORS, lineHysteresis[i]);
    saveWord(i + NUMSENSORS + (NUMSENSORS<<1), -lineHysteresis[i]);
  }
}

void loadCalibration()
{
  bool valid = true;
  // First check all values are valid. If not we simply use default values
  for(int i=0; i<(NUMSENSORS<<1); i++)
    if(loadWord(i) + loadWord(i + (NUMSENSORS<<1)) != 0)
      valid = false;
  if(valid)
  {
    for(int i=0; i<NUMSENSORS; i++)
    {
      lineThreshold[i] = loadWord[i];
      lineHysteresis[i] = loadWord[i + NUMSENSORS];
    }
  }
  else
  {
    for(int i=0; i<NUMSENSORS; i++)
    {
      lineThreshold[i] = defaultThreshold;
      lineHysteresis[i] = defaultHysteresis;
    }
  }
}

void saveWord(int i, int val)
{
  int idx = i << 1;
  EEPROM.update(idx, val & 0xff);
  EEPROM.update(idx + 1, (val>>8) & 0xff);
}

int loadWord(int i)
{
  int idx = i << 1;
  int rval = EEPROM.read(idx);
  rval |= (EEPROM.read(idx + 1)<<8);
}

void checkWhite(int sensor, int value, int indPin)
{
  lineState[sensor] = (value < defaultThreshold) ? 1 : 0;  // 1 is black line, no hysteresis used here
  digitalWrite(indPin, lineState[sensor]);
}

void checkState(int sensor, int value, int indPin)
{
  lineMax[sensor] = max(lineMax[sensor], value);
  lineMin[sensor] = min(lineMin[sensor], value);
  if(DEBUG)
  {
    Serial.println("Sensor/State/Value/Max/Min " + String(sensor) + "/" + String(lineState[sensor]) + "/" + String(value) + "/" + String(lineMax[sensor]) + "/" + String(lineMin[sensor]));
  }
  if(lineState[sensor] < 10)
  {
    if((lineState[sensor] & 1) == 0)   // even numbers are white, looking for black
    {
      if(value < (defaultThreshold - defaultHysteresis))  // black line found
      {
        digitalWrite(indPin, true);
        lineState[sensor]++;
      }
    }
    else    // odd numbers are black, looking for white
    {
      if(value > (defaultThreshold + defaultHysteresis))
      {
        digitalWrite(indPin, false);
        lineState[sensor]++;
      }
    }
  }
}

void clearStates()
{
  for (int i=0; i<NUMSENSORS; i++)
  {
    lineState[i] = 0;
    lineMax[i] = lineMin[i] = defaultThreshold;
  }
}

void resetWheelSensors(int sensor)
{
  if(sensor==0 || sensor==2)
    publicCountL = 0;
  if(sensor==1 || sensor==2)
    publicCountR = 0;
}

void trimWheelSensors(int8_t trimDistance, int8_t trimAngle)
{
  pulsesPerCm = defaultPulsesPerCm + ((double)trimDistance)/5.0;
  pulsesPerDegree = defaultPulsesPerDegree + ((double)trimAngle)/10.0;
  saveTrims(trimDistance, trimAngle);
}

void setSumErrors(int8_t flag)
{
  sumErrors = (flag > 0);
}

void clearSumErrors()
{
  trackErrorL = trackErrorR = 0;
}

void setStopBrake(int8_t sThresh, int8_t bThresh, int8_t speed)
{
  stopThreshold = (pulsesPerCm * (sThresh / 10.0));
  brakeThreshold = (pulsesPerCm * (bThresh / 10.0));
  brakingSpeed = speed;
}

void setStartPWM(uint8_t startMin, uint8_t startMax)
{
  startPWMmin = startMin;
  startPWMmax = startMax;
  if(DEBUG)
    Serial.println("PWM Min:" + String(startPWMmin) + " Max:" + String(startPWMmax));
}

void setPIDConstants(int8_t sKp, int8_t sKi, int8_t sKd, int8_t sKc)
{
  Kp = sKp / 10;
  Ki = sKi / 10;
  Kd = sKd / 10;
  Kc = sKc / 10;
}

void saveTrims(int8_t trimDistance, int8_t trimAngle)
{
  if(DEBUG)
    Serial.println("Saving: " + String(trimDistance) + "/" + String(trimAngle));
  EEPROM.update(TRIMDIST, trimDistance);
  EEPROM.update(TRIMDIST+1, -trimDistance);
  EEPROM.update(TRIMANGLE, trimAngle);
  EEPROM.update(TRIMANGLE+1, -trimAngle);
}

void loadTrims()
{
  int trimDistance, trimAngle;
  int checkDistance, checkAngle;
  pulsesPerCm = defaultPulsesPerCm;
  pulsesPerDegree = defaultPulsesPerDegree;
  trimDistance = (int8_t)EEPROM.read(TRIMDIST);
  checkDistance = (int8_t)EEPROM.read(TRIMDIST+1);
  trimAngle = (int8_t)EEPROM.read(TRIMANGLE);
  checkAngle = (int8_t)EEPROM.read(TRIMANGLE+1);
  if(DEBUG)
    Serial.println("Loading: " + String(trimDistance) + "/" + String(trimAngle));
  if((trimDistance + checkDistance) == 0)
    pulsesPerCm = defaultPulsesPerCm + ((double)trimDistance)/5.0;
  if((trimAngle + checkAngle) == 0)
    pulsesPerDegree = defaultPulsesPerDegree + ((double)trimAngle)/10.0;
}

void setIndicator(int sensor, byte value)
{
  if(value == AUTO)
    autoIndicate = true;
  else
  {
    switch(sensor)
    {
      case 0: digitalWrite(LNLS, value); break;
      case 1: digitalWrite(LNRS, value); break;
      case 2: digitalWrite(LNCS, value); break;
    }
    autoIndicate = false;
  }
}

void setThreshold(int threshold, int hysteresis)
{
  lineThreshold[0] = lineThreshold[1] = lineThreshold[2] = threshold;
  lineHysteresis[0] = lineHysteresis[1] = lineHysteresis[2] = hysteresis;
  saveCalibration();
}

void motionStart()
{
  if(DEBUG)
    Serial.println("motionStart");
  inputValues[ACKNAK] = i2cNAK;
  inputChannel = ACKNAK;
}

void motionStop()
{
  if(DEBUG)
    Serial.println("motionStop");
  inputValues[ACKNAK] = i2cACK;
}

void readInputs()
{
  long volt1 = analogRead(PSUPIN);
  unsigned int volt = (volt1 * 65) / 100; // convert to hundredths of a volt
  //Serial.println("Volt1:" + String(volt1) + "  volt" + String(volt));
  readLines();
  inputValues[DLINEL] = checkThreshold(0, inputValues[DLINEL], inputValues[ALINEL], LNLS);
  inputValues[DLINER] = checkThreshold(1, inputValues[DLINER], inputValues[ALINER], LNRS);
  inputValues[DLINEC] = checkThreshold(2, inputValues[DLINEC], inputValues[ALINEC], LNCS);
  inputValues[LIGHTL] = analogRead(LTL);
  inputValues[LIGHTR] = analogRead(LTR);
  inputValues[PSU] = volt;
  // now save current pulse counts
  inputValues[LPULSEL] = publicCountL & 0xffff;
  inputValues[LPULSEH] = (publicCountL >> 16) & 0xffff;
  inputValues[RPULSEL] = publicCountR & 0xffff;
  inputValues[RPULSEH] = (publicCountR >> 16) & 0xffff;
  inputValues[LASTERRL] = encoderErrorL;
  inputValues[LASTERRR] = encoderErrorR;
}

void readLines()
{
  int amb0, amb1, amb2;
  // disable IR transmitters and read ambient light
  digitalWrite(LNEN, LOW);
  delay(1); // don't want to do this
  amb0 = analogRead(LNL);
  amb1 = analogRead(LNR);
  amb2 = analogRead(LNC);
  digitalWrite(LNEN, HIGH);
  delay(1); // really don't want to do this
  inputValues[ALINEL] = analogRead(LNL) - amb0;
  inputValues[ALINER] = analogRead(LNR) - amb1;
  inputValues[ALINEC] = analogRead(LNC) - amb2;
}

byte checkThreshold(int idx, int oldDVal, int newAVal, int indPin)
{
	if(newAVal < (lineThreshold[idx] - lineHysteresis[idx]))
	   oldDVal = 1;
	else if(newAVal > (lineThreshold[idx] + lineHysteresis[idx]))
	   oldDVal = 0;
  if(autoIndicate)
    digitalWrite(indPin, oldDVal);
	return oldDVal;
}

// This function is called for every data read request. We always return a Word (16-bits). Low byte first.
// All data is held in the inputValues[] array
void requestEvent()
{
  byte outBuf[2];
  if (false)
    Serial.println("Writing: " + String(inputValues[inputChannel]));
  if (inputChannel >= STARTFLASH) // Read EEROM
  {
    // bytes 0..12 reserved for line sensor calibration
    int16_t rVal = 0;
    int addr = inputChannel - STARTFLASH;  // addr is sent as (location + StartFlash). So all remote Reads/Writes start at startFlash. Lower addresses for internal use only
    if (DEBUG)
      Serial.println("Read at: " + String(addr));
    rVal = (int8_t)EEPROM.read(addr);
    if(DEBUG)
      Serial.println("Reading: " + String(rVal));
    outBuf[0] = rVal & 0xff;
    outBuf[1] = 0;
  }
  else
  {
    outBuf[0] = inputValues[inputChannel]&0xff;
    outBuf[1] = inputValues[inputChannel]>>8;
  }
  if(inputChannel == ACKNAK && inputValues[ACKNAK] == i2cACK)
  { 
    inputValues[ACKNAK] = i2cNAK;
    inputChannel = 0;
  }
  Wire.write(outBuf, 2);
}

// function that executes whenever data is received from master
// Don't do much in this interrupt routine as interrupts stay switched off
void receiveEvent(int count)
{
  byte myCommand[10];
  //return;
  if (DEBUG)
    Serial.println("Data count:" + String(count));
  if (count == 1) // Select read register for next requestEvent()
  {
    microbit = true;
    inputChannel = Wire.read();
    if (DEBUG)
      Serial.println("Channel:" + String(inputChannel) + "  " + String(inputValues[inputChannel]));
  }
  else if (count >= 2 && count < 8)
  {
    microbit = true;
    for(int i=0; i<count; i++)
    {
      cmdBuf[wrIdx] = Wire.read();
      if(DEBUG)
        myCommand[i] = cmdBuf[wrIdx]; // for debug only
      if(++wrIdx > MAXBUF)
        wrIdx = 0;
    }
    cmdBuf[wrIdx] = 0; // ensure null command is next in queue
    if (DEBUG)
      Serial.println("Command " + String(myCommand[0]) + ": " + String(myCommand[1]) + "/" + String(myCommand[2]) + "/" + String(myCommand[3]) + "/" + String(myCommand[4]) + "/" + String(myCommand[5]) + "/" + String(myCommand[6]));
  }
  else // something odd happened. Read all outstanding bytes
  {
    if (DEBUG)
      Serial.println("Odd count:" + String(count));
    for (int i=0; i<count; i++)
      Wire.read();
  }
}

void setOutData(byte outReg, byte value)
{
  switch (IOConfigs[outReg])
  {
    case CFGONOFF:
      pwm[outReg + 4] = 0;
      if(value == 0)
        digitalWrite(IOPins[outReg], LOW);
      else
        digitalWrite(IOPins[outReg], HIGH);
      break;
    case CFGPWM:
      if (value == 0)
      {
        pwm[outReg] = 0;
        digitalWrite(IOPins[outReg], LOW);
      }
      else if (value >= 100)
      {
        pwm[outReg] = 0;
        digitalWrite(IOPins[outReg], HIGH);
      }
      else
      {
        pwm[outReg] = min(value, 99);
        digitalWrite(IOPins[outReg], LOW); // not strictly necessary as PWM will kick in eventually
        if (DEBUG)
        {
          Serial.println("PWM pin:" + String(outReg) + ", Value:" + String(value));
        }
      }
      break;
    case CFGSERVO:
      servos[outReg].write(value);
      break;
  }
}

void resetAll()
{
  inputValues[VERREV] = BOARD_REV + (FIRMWARE_REV << 8);
  digitalWrite(LNEN, 1);
  //clear all Fireleds
  allOff();  
}

// FastLED Functions
void setPixel(byte updates, byte pixel, byte red, byte green, byte blue)
{
  if (DEBUG)
    Serial.println("Reg:Val::" + String(updates) + ":" + String(pixel) + "  Red:" + String(red) + "  Green:" + String(green) + "  Blue:" + String(blue));
  if (pixel < NUMLEDS)
  {
    leds[pixel] = CRGB(red, green, blue);
    if (updates != 0)
      doShow = true;
  }
  else if (pixel == NUMLEDS)  // special case meaning ALL pixels
  {
    for (int i=0; i<(NUMLEDS); i++)
      leds[i] = CRGB(red, green, blue);
    if (updates != 0)
      doShow = true;
  }
}

void shiftLEDs(byte dir, byte arm)
{
  int start, count;
  switch(arm)
  {
    case ARMBOTH: start=0; count=12; break;
    case ARMLEFT: start=0; count=6; break;
    case ARMRIGHT: start=6; count=6; break;
  }
  if (dir == 0)
  {
    for (int i=start; i<start+count-1; i++)
      leds[i] = leds[i+1];
    leds[start+count-1] = 0;
  }
  else
  {
    for (int i=start+count-1; i>start; i--)
      leds[i] = leds[i-1];
    leds[start] = 0;
  }
  if (updateMode != 0)
    doShow = true;
}

void rotateLEDs(byte dir, byte arm)
{
  int start, count;
  switch(arm)
  {
    case ARMBOTH: start=0; count=12; break;
    case ARMLEFT: start=0; count=6; break;
    case ARMRIGHT: start=6; count=6; break;
  }
  if (dir == 0)
  {
    CRGB t = leds[start];
    for (int i=0; i<start+count-1; i++)
      leds[i] = leds[i+1];
    leds[start+count-1] = t;
  }
  else
  {
    CRGB t = leds[start+count-1];
    for (int i=start+count-1; i>0; i--)
      leds[i] = leds[i-1];
    leds[start] = t;
  }
  if (updateMode != 0)
    doShow = true;
}

void setRainbow(byte dir, byte arm)
{
  int i, d;
  int start, count;
  switch(arm)
  {
    case ARMBOTH: start=0; count=12; break;
    case ARMLEFT: start=0; count=6; break;
    case ARMRIGHT: start=6; count=6; break;
  }
  if (dir>0)
  {
    i = start+count-1;
    d = -1;
  }
  else
  {
    i = start;
    d = 1;
  }
  if(count == 12)
  {
    leds[i] = CRGB(255,0,0); i += d;
    leds[i] = CRGB(205,51,0); i += d;
    leds[i] = CRGB(154,102,0); i += d;
    leds[i] = CRGB(102,154,0); i += d;
    leds[i] = CRGB(51,205,0); i += d;
    leds[i] = CRGB(0,255,0); i += d;
    leds[i] = CRGB(0,205,54); i += d;
    leds[i] = CRGB(0,154,102); i += d;
    leds[i] = CRGB(0,102,154); i += d;
    leds[i] = CRGB(0,54,205); i += d;
    leds[i] = CRGB(0,0,255); i += d;
    leds[i] = CRGB(54,0,255); i += d;
  }
  else if (count == 6)
  {
    leds[i] = CRGB(255,0,0); i += d;
    leds[i] = CRGB(205,54,0); i += d;
    leds[i] = CRGB(0,255,0); i += d;
    leds[i] = CRGB(0,205,54); i += d;
    leds[i] = CRGB(0,0,255); i += d;
    leds[i] = CRGB(54,0,255); i += d;
  }
  if (updateMode != 0)
    doShow = true;
}

// Set single LED value (requires show)
void setLED(int ID, int red, int green, int blue)
{
  leds[ID] = CRGB(red, green, blue);
}

// Turns all the LEDs to OFF
void allOff()
{
  for (int i=0; i<NUMLEDS; i++)
    leds[i] = 0;
  FastLED.show();
}

// Sets all the LEDs to the same colour
void setAll(int red, int green, int blue)
{
  for (int i=0; i<NUMLEDS; i++)
    leds[i] = CRGB(red, green, blue);
  FastLED.show();
}
/////// End of FastLed functions ////

/// Wheel Encoder interrupt routines
void ISR_Left()
{
  totalCountL++;
  publicCountL += dirL;
  if((targetL > 0) && ((targetL - totalCountL) < stopThreshL))
  {
    digitalWrite(M1A, 1);
    digitalWrite(M1B, 1);
    pwmL = 0;
    DpwmL = 0;
    doneL = true; // not truly finished until speed is zero
  }
}

void ISR_Right()
{
  totalCountR++;
  publicCountR += dirR;
  if((targetR > 0) && ((targetR - totalCountR) < stopThreshR))
  {
    digitalWrite(M2A, 1);
    digitalWrite(M2B, 1);
    pwmR = 0;
    DpwmR = 0;
    doneR = true; // not truly finished until speed is zero
  }
}
// End of interrupt routines

double constrainD(double x, double lowVal, double highVal)
{
  if(x < lowVal)
    return lowVal;
  if(x > highVal)
    return highVal;
  return x;
}

// Motor functions
void driveDirect(byte speed, byte direction, byte motor)  // provided for compatibility. No PIDC control
{
  // speed is given as 0-100
  speed = map(speed, 0, 100, 0, 255);
  targetL = targetR = 0;  // switch of PID end of run
  if(motor == mLeft || motor == mBoth)
  {
    if(direction > 0)
    {
      analogWrite(M1A, speed);
      analogWrite(M1B, 0);
      dirL = -1;
    }
    else
    {
      analogWrite(M1A, 0);
      analogWrite(M1B, speed);
      dirL = 1;
    }
  }
  if(motor == mRight || motor == mBoth)
  {
    if(direction > 0)
    {
      analogWrite(M2A, speed);
      analogWrite(M2B, 0);
      dirR = -1;
    }
    else
    {
      analogWrite(M2A, 0);
      analogWrite(M2B, speed);
      dirR = 1;
    }
  }
}

void drive(int8_t speed)
{
  if(speed < 0)
    goReverse(-speed, 0);
  else if(speed == 0)
    allStop(COAST);
  else
    goForward(speed, 0);
}

void spin(int8_t speed)
{
  if(speed < 0)
    goSpinRight(-speed, 0);
  else if(speed == 0)
    allStop(COAST);
  else
    goSpinLeft(speed, 0);
}

void driveDistance(int8_t speed, int distance)
{
  if(speed < 0)
    goReverse(-speed, distance);
  else if(speed == 0)
    allStop(COAST);
  else
    goForward(speed, distance);
}

void spinAngle(int8_t speed, int angle)
{
  if(DEBUG)
    Serial.println("SpinAngle: " + String(speed) + "/" + String(angle));
  if(speed < 0)
    goSpinRight(-speed, angle);
  else if(speed == 0)
    allStop(COAST);
  else
    goSpinLeft(speed, angle);
}

void arc(int8_t speed, int radius, int angle)
{
  bool goLeft = (angle > 0);
  if(!goLeft)
    angle = -angle;
  if(speed == 0)
    allStop(COAST);
  else if(speed > 0)
    goArc(speed, radius, angle, goLeft, true); // forward, left/right
  else
    goArc(-speed, radius, angle, goLeft, false); // reverse, left/right
}

void goForward(int speed, double distance)
{
  targetL = targetR = distance * pulsesPerCm; // target is in cm. if zero, then never stop
  if(targetL != 0)
    targetL -= trackErrorL;
  if(targetR != 0)
    targetR -= trackErrorR;
  setMaxSpeed();
  pidLoop(speed, speed, true, true);
}

void goReverse(int speed, double distance)
{
  targetL = targetR = distance * pulsesPerCm; // target is in cm
  if(targetL != 0)
    targetL += trackErrorL;
  if(targetR != 0)
    targetR += trackErrorR;
  pidLoop(speed, speed, false, false);
}

void goSpinLeft(int speed, double angle)
{
  targetL = targetR = angle * pulsesPerDegree; // target is in cm
  if(targetL != 0)
    targetL += trackErrorL;
  if(targetR != 0)
    targetR -= trackErrorR;
  pidLoop(speed, speed, false, true);
}

void goSpinRight(int speed, double angle)
{
  if(DEBUG)
    Serial.println("goSpinRight: " + String(speed) + "/" + String(angle));
  targetL = targetR = angle * pulsesPerDegree; // target is in cm
  if(targetL != 0)
    targetL -= trackErrorL;
  if(targetR != 0)
    targetR += trackErrorR;
  pidLoop(speed, speed, true, false);
}

void goArc(int speed, int radius, int angle, bool left, bool fwd)
{
  int spdL, spdR;
  double ppDegInner = arcConst * (radius - halfWheelbase);
  double ppDegOuter = arcConst * (radius + halfWheelbase);
  double ppDegCentre = (ppDegOuter + ppDegInner) / 2;
  if(left)
  {
    targetL = ppDegInner * angle;
    targetR = ppDegOuter * angle;
    // normalise motor speeds to centre line
    spdL = (double)speed * (ppDegInner / ppDegCentre);
    spdR = (double)speed * (ppDegOuter / ppDegCentre);
  }
  else
  {
    targetL = ppDegOuter * angle;
    targetR = ppDegInner * angle;
    // normalise motor speeds to centre line
    spdL = (double)speed * (ppDegOuter / ppDegCentre);
    spdR = (double)speed * (ppDegInner / ppDegCentre);
  }
  if(targetL != 0)
    targetL += (fwd ? -trackErrorL : trackErrorL);
  if(targetR != 0)
    targetR += (fwd ? -trackErrorR : trackErrorR);

  if(DEBUG)
    Serial.println("Arc Target L/R: " + String(targetL) + "/" + String(targetR));
  pidLoop(spdL, spdR, fwd, fwd);
}

bool pidActive = false;
bool lastFwdL = false, lastFwdR = false;
int lastSpdL = 0, lastSpdR = 0;

void pidLoop(int spdL, int spdR, bool fwdL, bool fwdR)
{
  int cl, cr;
  byte cmd;
  pwmL = pwmR = startPWMmin;
  if(spdL >= 40)
    pwmL = map(spdL, 40, 100, startPWMmin, startPWMmax);
  if(spdR >= 40)
    pwmR = map(spdR, 40, 100, startPWMmin, startPWMmax);
  speedRatio = ((double)spdL) / ((double)spdR);
  if(DEBUG)
    Serial.println("PID Initialise:" + String(pwmL) + "/" + String(pwmR));
  lastTime = millis();
  targetSpeedL = (maxSpeed * spdL) / 100.0;
  targetSpeedR = (maxSpeed * spdR) / 100.0;
  targetSpeedL = constrain(targetSpeedL, minSpeed, maxSpeed);
  targetSpeedR = constrain(targetSpeedR, minSpeed, maxSpeed);
  DpwmL = pwmL;
  DpwmR = pwmR;
  totalCountL = totalCountR = 0;
  lastCountL = lastCountR = 0;
  targetCountL = targetCountR = 0;
  maxDiff = maxCountDiff = 0.0;
  doneL = doneR = targetFlagL = targetFlagR = false;

  lastSpdL = spdL;
  lastSpdR = spdR;
  lastFwdL = fwdL;
  lastFwdR = fwdR;
  for(;;)
  {
    go(fwdL ? pwmL : -pwmL, fwdR ? pwmR : -pwmR);
    delay(loopRate);
    cmd = cmdBuf[rdIdx];
    if(cmd==STOP || cmd==DRIVE || cmd==DRIVEDIST || cmd==SPIN || cmd==SPINANGLE || cmd==ARC || cmd==ARCANGLE || cmd==DIRECTMODE)  // don't process Motor commands here - break out and process them in main loop
      break;
    doCommand();
    readInputs();
    if (doShow)
    {
      FastLED.show();
      doShow = false;
    }

    countL = totalCountL - lastCountL;
    countR = totalCountR - lastCountR;
    lastCountL = totalCountL;
    lastCountR = totalCountR;
    if(countL == 0 && countR == 0 && doneL && doneR) 
    {
      if(DEBUG)
      {
        Serial.println();
        Serial.println("Done: Target L/R:" + String(targetL) + "/" + String(targetR) + "  Count L/R:" + String(lastCountL) + "/" + String(lastCountR));
        Serial.println("Max count diff: " + String(maxCountDiff));
      }
      allStop(BRAKE);
      break;
    }

    // use PID function to calculate new PWM values
    doPID();
    if(!fwdL)
      encoderErrorL = -encoderErrorL;
    if(!fwdR)
      encoderErrorR = -encoderErrorR;
    trackErrorL = sumErrors ? encoderErrorL : 0;
    trackErrorR = sumErrors ? encoderErrorR : 0;
  }
}

void doPID()  // updates the target pwmL and pwmR variables based on the PIDC algorithm
{
  // Input to algorithm is number of pulses since last loop & time since last loop
  // P = error in current speed
  // I = error in total distance (pulses) covered vs target
  // D = change in speed error since last loop
  // C = difference in current speed between the two wheels
  // Output PWM is: (current PWM) + P*Kp + I*Ki + D*Kd + C*Kc

  double deltaTime, ratio, cl, cr;
  double pwmDeltaL, pwmDeltaR;
  now = millis();
  deltaTime = (now - lastTime);
  ratio = loopRate / deltaTime;
  cl = countL;
  cr = countR;
  lastTime = now;

  // work out actual speed
  actualSpeedL = cl * ratio; // actual Speed is defined as pulses per loopRate (eg. pulses per 20ms)
  actualSpeedR = cr * ratio;
  stopThreshL = (stopThreshold * actualSpeedL) / maxSpeed;
  stopThreshR = (stopThreshold * actualSpeedR) / maxSpeed;

  // get error in speed - this is the 'P' in PID
  double errorSpeedL = targetSpeedL - actualSpeedL;
  double errorSpeedR = targetSpeedR - actualSpeedR;

  // work out target total distance so far
  targetCountL += targetSpeedL / ratio;
  targetCountR += targetSpeedR / ratio;
  // get error in total distance so far - this is the 'I' in PID
  double errorCountL = targetCountL - totalCountL;
  double errorCountR = targetCountR - totalCountR;

  // get change in speed error since last loop
  double deltaErrorSpeedL = errorSpeedL - lastErrorSpeedL;
  double deltaErrorSpeedR = errorSpeedR - lastErrorSpeedR;
  lastErrorSpeedL = errorSpeedL;
  lastErrorSpeedR = errorSpeedR;

  // when moving in an arc, the target speeds are NOT the same, so can't be directly compared
  // So convert the smaller speed to match the larger speed
  // Can't base it on the target distances as they may be zero for commands not terminated by target distance or angle
  // So base it on the target speeds
  double nomSpeedL=actualSpeedL, nomSpeedR=actualSpeedR;
  if(targetSpeedL > targetSpeedR)
  {
    nomSpeedL = actualSpeedL * targetSpeedR/targetSpeedL;
    nomSpeedR = actualSpeedR * targetSpeedL/targetSpeedR;
  }
  else if(targetSpeedL < targetSpeedR)
  {
    nomSpeedL = actualSpeedL * targetSpeedR/targetSpeedL;
    nomSpeedR = actualSpeedR * targetSpeedL/targetSpeedR;
  }
  double compSpeedL = actualSpeedR - nomSpeedL;
  double compSpeedR = actualSpeedL - nomSpeedR;

  if(abs(actualSpeedL - actualSpeedR) > maxDiff)
    maxDiff = abs(actualSpeedL - actualSpeedR);

  // Now we have all the data, let's calculate the PWM values. Getting total distance travelled by each wheel the same is most important (= straight line) so Kc should be largest
  pwmDeltaL = (errorSpeedL * Kp) + (errorCountL * Ki) + (deltaErrorSpeedL * Kd) + (compSpeedL * Kc);
  pwmDeltaR = (errorSpeedR * Kp) + (errorCountR * Ki) + (deltaErrorSpeedR * Kd) + (compSpeedR * Kc);

  DpwmL += pwmDeltaL;
  DpwmR += pwmDeltaR;

  // Ensure PWM values are within bounds
  DpwmL = constrainD(DpwmL, minPWM, maxPWM);
  DpwmR = constrainD(DpwmR, minPWM, maxPWM);

  if((targetL > 0) && ((targetL - totalCountL) < stopThreshL))
  {
    DpwmL = 0;
    if(DEBUG)
    {
      Serial.println("Stop L");
      Serial.println(String(pwmL) + "," + String(pwmR) + "," + String(0) + "," + String(actualSpeedR) + "," + String(targetSpeedL) + "," + String(totalCountL) + "," + String(totalCountR) + "," + String(targetL));
    }
  }
  if((targetR > 0) && ((targetR - totalCountR) < stopThreshR))
  {
    DpwmR = 0;
    if(DEBUG)
    {
      Serial.println("Stop R");
      Serial.println(String(pwmL) + "," + String(pwmR) + "," + String(actualSpeedL) + "," + String(0) + "," + String(targetSpeedL) + "," + String(totalCountL) + "," + String(totalCountR) + "," + String(targetL));
    }
  }

  if(CORRECT && PIDenable)
  {
    if(!doneL)
    {
      if((targetL > 0) && ((targetL - totalCountL) < (brakeThreshold*(targetSpeedL/(double)maxSpeed))) && !targetFlagL)
      {
        targetSpeedL = min(brakingSpeed, targetSpeedL);
        DpwmL = 100 * targetSpeedL/maxSpeed;
        targetFlagL = true;
        if(DEBUG)
          Serial.println("Brake L");
      }
      pwmL = DpwmL;
    }
    if(!doneR)
    {
      if((targetR > 0) && ((targetR - totalCountR) < (brakeThreshold*(targetSpeedR/(double)maxSpeed))) && !targetFlagR)
      {
        targetSpeedR = min(brakingSpeed, targetSpeedR);
        DpwmR = 100 * targetSpeedR/maxSpeed;
        targetFlagR = true;
        if(DEBUG)
          Serial.println("Brake R");
      }
      pwmR = DpwmR;
    }
  }

  if(DEBUG)
  {
    Serial.println("P: Speeds Tar L/R: " + String(targetSpeedL) + "/" + String(targetSpeedR) + " Act L/R: " + String(actualSpeedL) + "/" + String(actualSpeedR) + " Err L/R: " + String(errorSpeedL) + "/" + String(errorSpeedR));
    Serial.println("I: Current Target Dist L/R: " + String(targetCountL) + "/" + String(targetCountR) + "  Err L/R: " + String(errorCountL) + "/" +String(errorCountR));
    Serial.println("D: Delta Speed Err L/R: " + String(deltaErrorSpeedL) + "/" + String(deltaErrorSpeedR));
    Serial.println("C: Distance. Target L/R: " + String(targetL) + "/" + String(targetR) + " Actual: " + String(totalCountL) + "/" + String(totalCountR) + "  Difference: " + String(totalCountR - totalCountL));
    Serial.println("Delta pwm L/R " + String(pwmDeltaL) + "/" + String(pwmDeltaR));
    Serial.println("New PWM L/R: " + String(pwmL) + "/" + String(pwmR));
    Serial.println();
  }
  if(abs(totalCountL - totalCountR) > abs(maxCountDiff))
    maxCountDiff = totalCountL - totalCountR;
  encoderErrorL = (int)(totalCountL - targetL);
  encoderErrorR = (int)(totalCountR - targetR);

}

void go(int left, int right)
{
  if(left < 0)
  {
    analogWrite(M1A, -left);
    analogWrite(M1B, 0);
    dirL = -1;
  }
  else
  {
    analogWrite(M1A, 0);
    analogWrite(M1B, left);
    dirL = 1;
  }
  if(right < 0)
  {
    analogWrite(M2A, -right);
    analogWrite(M2B, 0);
    dirR = -1;
  }
  else
  {
    analogWrite(M2A, 0);
    analogWrite(M2B, right);
    dirR = 1;
  }
}

void allStop(bool brake)
{
  digitalWrite(M1A, brake);
  digitalWrite(M1B, brake);
  digitalWrite(M2A, brake);
  digitalWrite(M2B, brake);
  pwmL = pwmR = 0;
  DpwmL = DpwmR = 0.0;
  doneL = doneR = true;
}
