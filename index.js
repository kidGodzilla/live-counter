const mjpegServer = require('mjpeg-server');
const text2png = require('text2png');
const express = require('express');
const sharp = require('sharp');
const fs = require('fs');
let app = express();
const port = 5000;
const debug = 0;

let handlers = {};
let counts = {};

function makeImg (id, cb) {
    if (!counts[id]) counts[id] = 0;
    let num = ++counts[id];
    num = num.toString();

    let img = text2png(num, {
        font: '80px Futura',
        color: 'lime',
        backgroundColor: 'black',
        lineSpacing: 10,
        padding: 20,
        output: 'buffer'
    });

    let buff = Buffer.from(img);

    sharp(buff).toFormat('jpeg').jpeg({
        quality: 65,
        force: true
    }).toBuffer().then(data => {

        if (cb && typeof cb === 'function') return cb(data);

    }).catch(e => console.log);
}

function writeToHandlers (id, data) {
    if (handlers[id]) {
        handlers[id].forEach(handler => {
            try { handler.write(data) } catch(e){ console.log(e) }
        });

        setTimeout(() => {
            handlers[id].forEach(handler => {
                try { handler.write(data) } catch(e){ console.log(e) }
            });
        }, 1000);
    }
}

app.get('/static/:id', (req, res) => {
    let { id } = req.params;

    makeImg(id, function (data) {
        writeToHandlers(id, data);

        res.set('Content-Type', 'image/jpeg');
        res.send(data);
    });
});

app.get('/live/:id', (req, res) => {
    let { id } = req.params;

    makeImg(id, function (data) {
        if (!handlers[id]) handlers[id] = [];

        handlers[id].push(mjpegServer.createReqHandler(req, res));

        writeToHandlers(id, data);
    });
});

app.listen(port, function () { console.log('App listening on port', port) });
