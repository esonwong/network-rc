import RPi.GPIO as GPIO
import time

directionPin = 17
speedPin = 18
GPIO.setmode(GPIO.BCM)
GPIO.cleanup(directionPin)
GPIO.cleanup(speedPin)
GPIO.setup(directionPin, GPIO.OUT)
GPIO.setup(speedPin, GPIO.OUT)

direction = GPIO.PWM(directionPin, 50)
speed = GPIO.PWM(speedPin, 500)

direction.start(0)
speed.start(0)

dc = 10
for i in range(40):
    dc += 2
    print('dc:', dc)
    speed.ChangeDutyCycle(dc)
    time.sleep(1);
