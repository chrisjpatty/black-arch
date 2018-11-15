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

# Main program loop to run indefinitely
def mainLoop():
    while True:
        try:
            # Try to attach reader listener
            id, text = reader.read()
            if id:
                # Send Node a message through STDOUT
                broadcast("@NODE:READ:" + str(id))
        except KeyboardInterrupt:
            # Listen for ctrl+C interruptions
            print("Exiting...")
            print("Cleaning up GPIO")
            GPIO.cleanup()
            print("GPIO cleaned")
            sys.exit()
        except Exception as e:
            print(e)
        finally:
            # Set thread-blocking delay between each read
            time.sleep(.1)

try:
    mainLoop()
finally:
    sys.exit()
