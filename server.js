var express = require("express"); // Requires the Express module
var cors = require("cors");
// Calls the express function to start a new Express application
var app = express();


app.use(cors());

var lessons = [
    {
        Id: "CST3144",
        subject: "Full Stack Development",
        Location: "Room 101",
        price: 10,
        availibility: 5
    },
    {
        Id: "CST3145",
        subject: "Business Intelligence",
        Location: "Room 102",
        price: 20,
        availibility: 5
    },
    {
        Id: "CST3146",
        subject: "AI",
        Location: "Room 103",
        price: 10,
        availibility: 5
    }
];


app.use(function(request, response) {
    // middleware
    console.log("In comes a request to: " + request.url);
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(lessons));
});
app.listen(3000, function() {
console.log("App started on port 3000");
});