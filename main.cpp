#include "pxt.h"

using namespace pxt;
namespace eggbit
{
    bool initialized = false;

    //%
    void init()
    {
        if (initialized) return;

    // mount buttons on the pins with no pullup
    // TODO: fix this issue in the DAL itself
    #define ALLOC_PIN_BUTTON(id) new MicroBitButton(getPin(id)->name, id, MICROBIT_BUTTON_ALL_EVENTS);
        ALLOC_PIN_BUTTON(MICROBIT_ID_IO_P12)
        ALLOC_PIN_BUTTON(MICROBIT_ID_IO_P8)
        ALLOC_PIN_BUTTON(MICROBIT_ID_IO_P14)
        ALLOC_PIN_BUTTON(MICROBIT_ID_IO_P16)
    #undef ALLOC_PIN_BUTTON

        initialized = true;
    }
}
