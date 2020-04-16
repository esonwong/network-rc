// stream splitter, broadcasting, and player signaling
const Splitter = require('stream-split')
const EventEmitter = require('events').EventEmitter
const NALseparator = Buffer.from([ 0, 0, 0, 1 ])// NAL break


function sendFrame (socket, frame) {

    /* handle streams that don't retransmit sps/pps like fmpeg omx -.- */
    /* const frameType = data[0] & 0x1f
        if (frameType == 7) {
          this.lastSPS = data
        }
        else if (frameType == 8) {
          this.lastPPS = data
        } */

    if (socket.buzy)
        return

    socket.buzy = true
    socket.buzy = false

    socket.send(Buffer.concat([ NALseparator, frame ]), { binary: true }, function ack () {
        socket.buzy = false
    })
}

module.exports = class WSAvcServer extends EventEmitter {
    // TODO: changable width and height
    constructor (wss, width, height, options = {}) {
        super()
        // init ws
        /* if (!wss) {
            throw new Error('WS is required')
        }  */
        // etc
        this.options = {
            width: width || 960,
            height: height || 540,
            ...options,
        }

        this.clients = new Set()

        this.broadcast = this.broadcast.bind(this)
        this.new_client = this.new_client.bind(this)
        this.client_events = new EventEmitter()
        if (wss) {
            wss.on('connection', this.new_client)
        }


    }

    setVideoStream (readStream) {
        this.readStream = readStream
        readStream = readStream.pipe(new Splitter(NALseparator))
        readStream.on('data', this.broadcast(sendFrame))

        this.broadcast('stream_active', true )

        readStream.on('end', () => this.broadcast('stream_active', false ))

    }

    broadcast (action, payload) {
        // callback mode
        if (typeof action === 'function') {
            return data => this.clients.forEach(socket => action(socket, data))
        } else {
            return this.clients.forEach(socket => socket.send(JSON.stringify({ action, payload })))
        }
    }

    new_client (socket) {
        this.clients.add(socket)
        this.emit('client_connected', socket)
        // console.log(`currently there are ${ this.clients.size } connected clients`)
        socket.on('close', () => {
            this.clients.delete(socket)
            this.emit('client_disconnected', socket)
            // console.log(`currently there are ${ this.clients.size } connected clients`)
        })
        socket.send(JSON.stringify({
            action: 'initalize',
            payload: {
                width: this.options.width,
                height: this.options.height,
                stream_active: !!(this.readStream && this.readStream.readable),
            },
        }))

        socket.send(JSON.stringify({ action: 'stream_active', payload: !!(this.readStream && this.readStream.readable) }))

        socket.on('message', m => {
            const { action, payload } = JSON.parse(m)
            this.client_events.emit(action, payload)
        })


        /* handle streams that don't retransmit sps/pps like fmpeg omx -.- */
        /*
        if (this.lastSPS) {
            socket.send(Buffer.concat([ NALseparator, this.lastSPS ]), { binary: true })
        }
        if (this.lastPPS) {
            socket.send(Buffer.concat([ NALseparator, this.lastPPS ]), { binary: true })
        }
        */
    }

}
