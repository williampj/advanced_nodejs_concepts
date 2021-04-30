const https = require("https");

const start = Date.now();

// res callback parameter is an event emitter

const doRequest = () => {
  https
    .request("https://www.google.com", (res) => {
      res.on("data", () => {});
      res.on("end", () => {
        console.log(Date.now() - start);
      });
    })
    .end(); // do not forget to add this for the request function to work
};

doRequest();
doRequest();
doRequest();
doRequest();
doRequest();
doRequest();

// All six tasks will be completed simultaneously
