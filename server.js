"use strict";

var express     = require("express");
var bodyParser  = require("body-parser");
var expect      = require("chai").expect;
var cors        = require("cors");

var apiRoutes         = require("./routes/api.js");
var fccTestingRoutes  = require("./routes/fcctesting.js");
var runner            = require("./test-runner");

const helmet = require("helmet");

var app = express();

app.use("/public", express.static(process.cwd() + "/public"));

app.use(cors({origin: "*"})); //For FCC testing purposes only


let ninetyDaysInMilliseconds = 90*24*60*60*1000;
app.use(helmet({
  frameguard: "same-origin",
  hidePoweredBy: {setTo: "PHP 4.2.0"},
  xssFilter: true,
  noSniff: true,
  ieNoOpen: true,  
  hsts: {maxAge: ninetyDaysInMilliseconds, force: true},
  dnsPrefetchControl: true,
  referrerPolicy: {policy: "same-origin"},
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'"],
      imgSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://code.jquery.com"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: true,
    }
  }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Sample front-end
app.route("/b/:board/")
  .get(function (req, res) {
    res.sendFile(process.cwd() + "/views/board.html");
  });
app.route("/b/:board/:threadid")
  .get(function (req, res) {
    res.sendFile(process.cwd() + "/views/thread.html");
  });

//Index page (static HTML)
app.route("/")
  .get(function (req, res) {
    res.sendFile(process.cwd() + "/views/index.html");
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);

//Sample Front-end

    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type("text")
    .send("Not Found");
});

app.use(function (err, req, res, next) {  
  res.status(err.statuscode).send(err.message);
});

//Start our server and tests!
app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port " + process.env.PORT);
  if(process.env.NODE_ENV==="test") {
    console.log("Running Tests...");
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        var error = e;
        console.log("Tests are not valid:");
        console.log(error);
      }
    }, 1500);
  }
});

module.exports = app; //for testing
