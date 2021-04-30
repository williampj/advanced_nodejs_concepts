process.env.UV_THREADPOOL_SIZE = 5;

const crypto = require("crypto"); // standard library

const start = Date.now();

// When we run the file, all following functions will be evoked at around the same time

crypto.pbkdf2("a", "b", 100000, 512, "sha512", () => {
  console.log("1:", Date.now() - start); // prints how many miliseconds it took to calculate the hash
});
crypto.pbkdf2("a", "b", 100000, 512, "sha512", () => {
  console.log("2:", Date.now() - start);
});

crypto.pbkdf2("a", "b", 100000, 512, "sha512", () => {
  console.log("3:", Date.now() - start);
});

crypto.pbkdf2("a", "b", 100000, 512, "sha512", () => {
  console.log("4:", Date.now() - start);
});

crypto.pbkdf2("a", "b", 100000, 512, "sha512", () => {
  console.log("5:", Date.now() - start);
});
