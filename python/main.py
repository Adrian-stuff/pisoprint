from pyA20.gpio import gpio
from pyA20.gpio import port
from time import sleep
gpio.init()
def has_changes(input_sequence):
    # Check if there are changes in the input sequence
    return len(set(input_sequence)) > 1

input_sequence = []
totalPulse = 0 
coinslot = port.PA6
gpio.setcfg(coinslot,gpio.INPUT)
gpio.pullup(coinslot, gpio.PULLUP)

while True:
    input_sequence.append(gpio.input(coinslot))
    #sleep(0.05)

    #print("seq", input_sequence)

    #result = count_changes(input_sequence)
    if has_changes(input_sequence):
        
        
        totalPulse += 1
        print(totalPulse/2)
        input_sequence = []
