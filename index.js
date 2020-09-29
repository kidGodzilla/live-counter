const express = require('express');
let app = express();
const port = 5000;
const debug = 0;
let counts = {};

app.get('/:id', (req, res) => {
    let { id } = req.params;

});

app.listen(port, function () { console.log('App listening on port', port) });
