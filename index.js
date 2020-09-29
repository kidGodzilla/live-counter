const mjpegServer = require('mjpeg-server');
const syncViaFtp = require('sync-via-ftp');
const text2png = require('text2png');
const express = require('express');
const sharp = require('sharp');
let app = express();
const port = 5000;
const debug = 0;

global.counts = syncViaFtp('counts');
let handlerTimers = {};
let handlers = {};

/**
 * Create a jpeg image representing our current count & return as buffer
 */
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
        quality: 50,
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

        clearTimeout(handlerTimers[id]);

        handlerTimers[id] = setTimeout(() => {
            handlers[id].forEach(handler => {
                try { handler.write(data) } catch(e){}
            });
        }, 800);
    }
}

function fixId (id) {
     return (id.length > 20) ? id.substring(0, 20) : id;
}

/**
 * Outputs a static image as a hit counter, updating live images as well
 */
app.get('/static/:id', (req, res) => {
    let { id } = req.params;
    id = fixId(id);

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
    id = fixId(id);

    makeImg(id, req.query, function (data) {
        if (!handlers[id]) handlers[id] = [];

        handlers[id].push(mjpegServer.createReqHandler(req, res));

        writeToHandlers(id, data);
    });
});


// Serve public directory
app.use(express.static('public'));

// See counts (debug)
app.get('/counts', (req, res) => { res.json(counts) });

app.listen(port, function () { console.log('App listening on port', port) });
