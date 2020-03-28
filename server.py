from flask import Flask
from flask_socketio import SocketIO
from werkzeug.middleware.proxy_fix import ProxyFix
import RPi.GPIO as GPIO


directionPin = 17
speedPin = 18
GPIO.setmode(GPIO.BCM)
GPIO.setup(directionPin, GPIO.OUT)
GPIO.setup(speedPin, GPIO.OUT)

direction = GPIO.PWM(directionPin, 50)
speed = GPIO.PWM(speedPin, 500)

direction.start(0)
speed.start(0)
speed.ChangeDutyCycle(67.5);

app = Flask(__name__,static_folder='public')
app.secret_key = "eson"
socketio = SocketIO(app, cors_allowed_origins="*")


@app.route('/')
def root():
    return app.send_static_file('index.html')


@socketio.on('connect')
def connect_handler():
    print('connct')

@socketio.on('message')
def handle_message(message):
    print('received message: ' + message)


@socketio.on('direction')
def handle_direction(rate):
    print('received direction: ' + str(rate))
    direction.ChangeDutyCycle(rate * 5 + 7.5)


@socketio.on('speed')
def handle_speed(rate):
    print('received speed: ' + str(rate))
    speed.ChangeDutyCycle(rate * 7.5 + 67.5)

@socketio.on("speed rate")
def handle_speed_rate(rate):
    print('received speed rate: ' + str(rate))
    speed.ChangeDutyCycle(rate)

# app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

if __name__ == '__main__':
    socketio.run(app,host="0.0.0.0", port= 5015)
#    app.run(port= 5015)
