// This file combines network requests (using Libuv's underlying OS async features) and hashing (using Libuv's threadpool)
// The purpose is to show that these don't conflict, that it's a fast, non-blocking program b/c event loop delegates tasks to libuv's threadpool and OS async primitives

const crypto = require("crypto"); // standard library
const https = require("https");
const fs = require("fs");

const start = Date.now();

process.env.UV_THREADPOOL_SIZE = 1;

function doRequest() {
  https
    .request("https://www.google.com", (res) => {
      res.on("data", () => {});
      res.on("end", () => {
        console.log("Network", Date.now() - start);
      });
    })
    .end(); // do not forget to add this for the request function to work
}

function doHash() {
  crypto.pbkdf2("a", "b", 100000, 512, "sha512", () => {
    console.log("Hash", Date.now() - start); // prints how many miliseconds it took to calculate the hash
  });
}

doRequest();

fs.readFile("multitask.js", "utf8", () => {
  console.log("FS:", Date.now() - start);
});

doHash();
doHash();
doHash();
doHash();
doHash();

// =>
// Network 129
// Hash 744
// FS: 745
// Hash 751
// Hash 752
// Hash 754
