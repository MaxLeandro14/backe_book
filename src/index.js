
const express = require('express');
const routes = require('./routes');
const cors = require('cors');
const path = require('path');
const app = express();
app.use(express.json());
app.use(cors());

app.use('/files', express.static(path.resolve(__dirname, 'tmp', 'uploads' ,'room')))
app.use(routes);
app.listen(3333);