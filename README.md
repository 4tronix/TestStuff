# Makecode Extension for 4tronix EggBit Range

This library provides a Microsoft Makecode extension for 4tronix EggBit range of wearables, see
https://4tronix.co.uk/eggbit/.

## Reading the buttons

There are 4 buttons that can be checked: `Red`, `Yellow`, `Green` and `Blue`.

You can directly read the state of each button.
If the button is pressed it will return a '1'. If it isn't pressed, then it returns a '0'
The following code checks the Green button and does something if it is pressed

```
// Check Green button
if (eggbit.readButton(EBButtons.Green) == 1) {
    ... do something ...
}
```

Alternatively, you can wait for an event Button Press, or Button Release and then take action



## Fireled helpers

The EggBit has 9 Fireleds
The default update mode is automatic so LEDs will be updated immediately after changes

```blocks
// Set all leds to Red
eggbit.setLedColor(0xff0000);

// Clear all leds
eggbit.ledClear();

// Set Fireled at position 1 to Green
eggbit.setPixelColor(0, 0x00ff00);

// Show rainbow across all Fireleds (Red..Violet)
eggbit.ledRainbow();

// Show led rainbow and shift
eggbit.ledRainbow();
eggbit.ledShift();

// Show led rainbow and rotate
eggbit.ledRainbow();
eggbit.ledRotate();

// Set brightness of leds
eggbit.ledBrightness(100);
```

## Supported targets

* for PXT/microbit

## License
MIT
