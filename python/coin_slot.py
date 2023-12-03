from pyA20.gpio import gpio
from pyA20.gpio import port
import time

# Set the pin numbering mode
gpio.init()

# Pin 8 will be used for input
pin = port.PA13

# Set pin 8 as an input pin
gpio.setcfg(pin, gpio.INPUT)
gpio.pullup(pin,gpio.PULLUP)
isReading = True
counterTotal = 0
total = 0
value = 0
counter = 0
try:
    while True:
        while isReading:
            if gpio.input(pin) == 0:
                counter += 1
                time.sleep(0.1)
                print("counter: ",counter)

                counterTotal = counter
            if counterTotal in [1,3,5]:
                isReading = False
        if counterTotal == 1 or counterTotal == 3:
            value = value + counterTotal / counterTotal
        if counterTotal == 5:
            value = value + counterTotal / counterTotal + 1

        total = total + value
        counter = 0

        if total != 0:
            print(total)
        total = 0
        value = 0
except KeyboardInterrupt:
    # If the program is stopped with a keyboard interrupt, clean up the GPIO pins
    #gpio.cleanup()
    print("bye")
