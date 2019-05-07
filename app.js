const express = require("express");
const app = express();
const { main } = require("./src/algorithm/hybrid_algorithm");
const path = require("path");

require("dotenv").config();
const bodyParser = require("body-parser");
const validate = require("express-validation");
const req_body_val = require("./src/schema/request_body");
// const fs = require('fs');

app.set("view engine", "ejs");
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/client/build/index.html"));
});

app.post("/ttdp", validate(req_body_val), (req, res) => {
  main(req.body).subscribe({
    next: results => res.status(201).json(results),
    error: err => {
      console.log(err);
      res.status(500).json(err)
    }
  });
});

// error handler
app.use((err, req, res, next) => {
  res.status(400).json(err);
  next();
});

app.listen(8080);
