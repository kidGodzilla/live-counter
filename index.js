const mjpegServer = require('mjpeg-server');
const syncViaFtp = require('sync-via-ftp');
const text2png = require('text2png');
const express = require('express');
const sharp = require('sharp');
let app = express();

const port = process.env.PORT || 5000;
const debug = process.env.DEBUG || 0;

global.counts = syncViaFtp('counts');
let handlerTimers = {};
let handlers = {};
let updated = {};
let imgs = {};

/**
 * Create a jpeg image representing our current count & return as buffer
 */
function makeImg (id, config, cb, noIncrement) {
    let { font, color, bg } = config;
    if (!counts[id]) counts[id] = 0;

    if (!noIncrement) counts[id]++;
    let num = (counts[id]).toString();

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
        imgs[id] = data;

        if (cb && typeof cb === 'function') return cb(data);
    }).catch(e => console.log);
}

/**
 * Attempts to write to all existing output handlers
 */
function writeToHandlers (id, data) {
    if (!data || !id) return;

    if (handlers[id]) {
        updated[id] = (+ new Date());

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

/**
 * Update live output every 30s or so
 */
setInterval(() => {
    let fifteenSecondsAgo = (+ new Date()) - (15 * 1000);

    for (let id in updated) {
        if (updated < fifteenSecondsAgo) {}

        let data = imgs[id];
        if (data) writeToHandlers(id, data);
    }
}, 10 * 1000);

/**
 * Automatically clean up most handlers on a 5 minute interval
 * (the last 10 handlers will remain)
 */
setInterval(() => {
    // Last n items
    function last (n, a) {
        if (a.length <= n) return a;
        return a.slice(Math.max(a.length - n, 0));
    }

    for (let k in handlers) {
        handlers[k] = last(10, handlers[k]);
    }
}, 5 * 60 * 1000);


// Serve public directory
app.use(express.static('public'));

// See debug output
app.get('/counts', (req, res) => { res.json(counts) });
app.get('/updated', (req, res) => { res.json(updated) });

app.listen(port, function () { console.log('App listening on port', port) });
