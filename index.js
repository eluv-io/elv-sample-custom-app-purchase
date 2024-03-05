const express = require('express');
const fs = require('fs');
const app = express();

const port = 8080;
const host = '127.0.0.1';

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/login.html");
})

app.get('/app', (req, res) => {
  res.sendFile(__dirname + "/app.html");
})

app.listen(port, host);
console.log(`Running on http://${host}:${port}`);