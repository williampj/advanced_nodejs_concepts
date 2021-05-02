// index2.js uses PM2 as cluster management tool

process.env.UV_THREADPOOL_SIZE = 1;

// Is the file being executed in master mode?

const crypto = require("crypto");
const express = require("express");

const app = express();

// Running the following function from a controller will completely hold up the server's thread for five seconds
// Other requests will also be queued during this time

app.get("/", (req, res) => {
  crypto.pbkdf2("a", "b", 100000, 512, "sha512", () => {
    console.log("crypto hash");
  });
  res.send("Hi there");
});

app.get("/fast", (req, res) => {
  res.send("This was fast!");
});

app.listen("3000");
