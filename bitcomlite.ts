// Switch events
enum bclEvents {
    //% block="pressed"
    Pressed = DAL.MICROBIT_BUTTON_EVT_UP,
    //% block="released"
    Released = DAL.MICROBIT_BUTTON_EVT_CLICK
}

enum bclPins
{
    //% block="p1"
    p1 = <number>DAL.MICROBIT_ID_IO_P1,
    //% block="p2"
    p2 = <number>DAL.MICROBIT_ID_IO_P2,
    //% block="p8"
    p8 = <number>DAL.MICROBIT_ID_IO_P8,
    //% block="p12"
    p12 = <number>DAL.MICROBIT_ID_IO_P12,
    //% block="p13"
    p13 = <number>DAL.MICROBIT_ID_IO_P13,
    //% block="p14"
    p14 = <number>DAL.MICROBIT_ID_IO_P14,
    //% block="p15"
    p15 = <number>DAL.MICROBIT_ID_IO_P15,
    //% block="p16"
    p16 = <number>DAL.MICROBIT_ID_IO_P16,
}


/**
 * Custom blocks
 */
//% weight=50 color=#e7660b icon="\uf11b"
namespace bclite
{
    let switchInit = true;

// Switch Handling Blocks

    function eventInit()
    {
        if (switchInit)
        {
            pins.setPull(DigitalPin.P1, PinPullMode.PullDown)
            pins.setPull(DigitalPin.P2, PinPullMode.PullDown)
            pins.setPull(DigitalPin.P8, PinPullMode.PullDown)
            pins.setPull(DigitalPin.P12, PinPullMode.PullDown)
            pins.setPull(DigitalPin.P13, PinPullMode.PullDown)
            pins.setPull(DigitalPin.P14, PinPullMode.PullDown)
            pins.setPull(DigitalPin.P15, PinPullMode.PullDown)
            pins.setPull(DigitalPin.P16, PinPullMode.PullDown)

            pins.setEvents(DigitalPin.P1, PinEventType.Edge)
            pins.setEvents(DigitalPin.P2, PinEventType.Edge)
            pins.setEvents(DigitalPin.P8, PinEventType.Edge)
            pins.setEvents(DigitalPin.P12, PinEventType.Edge)
            pins.setEvents(DigitalPin.P13, PinEventType.Edge)
            pins.setEvents(DigitalPin.P14, PinEventType.Edge)
            pins.setEvents(DigitalPin.P15, PinEventType.Edge)
            pins.setEvents(DigitalPin.P16, PinEventType.Edge)

            switchInit = false;
        }
    }

    /**
      * Registers event code
      * @param button name of button to handle
      * @param event type of event to handle
      */
    //% weight=100
    //% blockId=OnButtonEvent block="on 06 button%button|%event"
    export function onButtonEvent(button: bclPins, event: bclEvents, handler: Action)
    {
        eventInit();
        control.onEvent(<number>button, <number>event, handler); // register handler
    }

    /**
      * check button state
      * @param button name of button to check
      */
    //% blockId="CheckButton" block="button%button|pressed"
    //% weight=90
    export function checkButton(button: bclPins): boolean
    {
	 return pins.digitalReadPin(<number>button)==1;
    }



}
