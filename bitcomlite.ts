// Switch events
enum bclEvents {
    //% block="off"
    Off = DAL.MICROBIT_BUTTON_EVT_UP,
    //% block="on"
    On = DAL.MICROBIT_BUTTON_EVT_CLICK
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
//% weight=50 color=#e7660b icon="\uf49e"
namespace bclite
{
    let switchInit = true;

// Switch Handling Blocks

    function eventInit()
    {
        if (switchInit)
        {
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
      * @param switch name of switch to handle
      * @param event type of event to handle
      */
    //% weight=100
    //% blockId=OnSwitchEvent block="on 02 switch%switch|%event"
    //% subcategory=Switch
    export function onSwitchEvent(switch: bclPins, event: blcEvents, handler: Action)
    {
        eventInit();
        control.onEvent(<number>switch, <number>event, handler); // register handler
    }

    /**
      * check switch state
      * @param switch name of switch to check
      */
    //% blockId="CheckSwitch" block="switch%switch|on"
    //% weight=90
    //% subcategory=Switch
    export function checkSwitch(switch: bclPins): boolean
    {
	 return pins.digitalReadPin(<number>switch)==0;
    }



}
