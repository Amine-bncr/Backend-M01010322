var express = require("express"); // Requires the Express module
var cors = require("cors");
// Calls the express function to start a new Express application
var app = express();


app.use(cors());


app.use(function(request, response) { // middleware
console.log("In comes a request to: " + request.url);
response.end("Hello, world!");
});
app.listen(3000, function() {
console.log("App started on port 3000");
});