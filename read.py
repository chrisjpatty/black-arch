#!/usr/bin/env python

import RPi.GPIO as GPIO
import SimpleMFRC522
import time
import sys
import select

reader = SimpleMFRC522.SimpleMFRC522()

print("Read started")

def broadcast(message):
    print(message)

def mainLoop():
    while True:
        try:
            id, text = reader.read()
            if id:
                broadcast("@NODE:READ:" + str(id))
        except KeyboardInterrupt:
            print("Exiting...")
            print("Cleaning up GPIO")
            GPIO.cleanup()
            print("GPIO cleaned")
            sys.exit()
        except Exception as e:
            print(e)
        finally:
            time.sleep(.1)

try:
    mainLoop()
finally:
    sys.exit()
