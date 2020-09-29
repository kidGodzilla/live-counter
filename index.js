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

function makeImg (id, config, cb) {
    let { font, color, bg } = config;
    if (!counts[id]) counts[id] = 0;

    let num = (++counts[id]).toString();

    if (!font) font = 'Technology-Bold'; // Futura
    if (!color) color = 'lime';
    if (!bg) bg = 'black';

    let img = text2png(num, {
        localFontPath: 'fonts/technology-bold.ttf',
        localFontName: 'Technology-Bold',
        font: `80px ${ font }`,
        backgroundColor: bg,
        output: 'buffer',
        lineSpacing: 10,
        color: color,
        padding: 20
    });

    let buff = Buffer.from(img);

    sharp(buff).toFormat('jpeg').jpeg({
        quality: 65,
        force: true
    }).toBuffer().then(data => {
        if (cb && typeof cb === 'function') return cb(data);
    }).catch(e => console.log);
}

/**
 * Attempts to write to all existing output handlers
 */
function writeToHandlers (id, data) {
    if (handlers[id]) {
        handlers[id].forEach(handler => {
            try { handler.write(data) } catch(e){}
        });

        setTimeout(() => {
            handlers[id].forEach(handler => {
                try { handler.write(data) } catch(e){}
            });
        }, 800);
    }
}

/**
 * Outputs a static image as a hit counter, updating live images as well
 */
app.get('/static/:id', (req, res) => {
    let { id } = req.params;

    makeImg(id, req.query, function (data) {
        writeToHandlers(id, data);

        res.set('Content-Type', 'image/jpeg');
        res.send(data);
    });
});

/**
 * Outputs a live hit counter as mjpeg
 */
app.get('/live/:id', (req, res) => {
    let { id } = req.params;

    makeImg(id, req.query, function (data) {
        if (!handlers[id]) handlers[id] = [];

        handlers[id].push(mjpegServer.createReqHandler(req, res));

        writeToHandlers(id, data);
    });
});

app.listen(port, function () { console.log('App listening on port', port) });
