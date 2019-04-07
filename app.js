const express = require("express");
const app = express();
const { main } = require("./src/algorithm/hybrid_algorithm");
const path = require('path');

require("dotenv").config();
const bodyParser = require("body-parser");
// const fs = require('fs');

app.set("view engine", "ejs");
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(express.static("public"));
app.use(express.static(path.join(__dirname, 'client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/client/build/index.html'));
});


app.post("/test", (req, res) => {
  main(req.body).subscribe({
    next: results => res.json(results),
    error: err => res.status(500).json(err)
  });
});

app.listen(8080);