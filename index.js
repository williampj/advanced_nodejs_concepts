const cluster = require("cluster");

// Is the file being executed in master mode?

if (cluster.isMaster) {
  // Cause index.js to be executed again but in child mode
  // if there is only one cluster.fork() call, then there will only be a single server instance and nothing will have been gained from cluster mode
  // NB: Every child will have its own thread pool

  cluster.fork();
  cluster.fork();
  cluster.fork();
} else {
  // It's a worker instance, it will act like a server and nothing else

  const express = require("express");

  const app = express();

  // Running the following function from a controller will completely hold up the server's thread for five seconds
  // Other requests will also be queued during this time

  const doWork = (duration) => {
    const start = Date.now();
    while (Date.now() - start < duration) {}
  };

  app.get("/", (req, res) => {
    doWork(5000);
    res.send("Hi there");
  });

  app.get("/fast", (req, res) => {
    res.send("This was fast!");
  });

  app.listen("3000");
}
