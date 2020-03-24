from flask import Flask, request, render_template
from flask_restful import Resource, Api
from flask_socketio import SocketIO

app = Flask(__name__,static_folder='public')
api = Api(app)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)


@app.route('/')
def root():
    return app.send_static_file('index.html')

class Steering(Resource):
    def get(self):
        return {"msg":"舵机GPIO初始化成功！"}
    
    def delete(self):
        return {"msg": "舵机GPIO已复位!"}


api.add_resource(Steering, '/steering') # Route_1

@socketio.on('connect')
def connect_handler():
    print('socket 客户端已连接')

@socketio.on('message')
def handle_message(message):
    print('received message: ' + message)


if __name__ == '__main__':
     socketio.run(app,host='0.0.0.0', debug=True)
