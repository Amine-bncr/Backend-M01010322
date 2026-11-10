
require("dotenv").config({ path: "./config.env" });

var express = require("express");
var cors = require("cors");
var { MongoClient } = require("mongodb");

var app = express();

app.use(cors());
app.use(express.json());

// Build MongoDB connection string from environment variables
var mongoUri =
    process.env.MONGODB_PREFIX +
    process.env.MONGODB_USERNAME + ":" +
    process.env.MONGODB_PASSWORD +
    process.env.MONGODB_URL;

var DB_NAME = "CourseworkDB";
var LESSONS_COLLECTION = "Lessons";

var SEED_LESSONS = [
    { Id: "CST3144", subject: "Full Stack Development", Location: "Room 101", price: 10, availibility: 5 },
    { Id: "CST3145", subject: "Business Intelligence", Location: "Room 102", price: 20, availibility: 5 },
    { Id: "CST3146", subject: "AI", Location: "Room 103", price: 10, availibility: 5 }
];

var client;
var db;

function connectToMongoDB() {
    return new Promise(function (resolve, reject) {

        if (
            !process.env.MONGODB_PREFIX ||
            !process.env.MONGODB_USERNAME ||
            !process.env.MONGODB_PASSWORD ||
            !process.env.MONGODB_URL
        ) {
            return reject(new Error("Missing MongoDB environment variables"));
        }

        client = new MongoClient(mongoUri);

        client.connect()
            .then(function () {
                db = client.db(DB_NAME);

                console.log("Successfully connected to MongoDB (CourseworkDB)");

                return db.collection(LESSONS_COLLECTION).countDocuments();
            })
            .then(function (count) {
                if (count === 0) {
                    return db.collection(LESSONS_COLLECTION)
                        .insertMany(SEED_LESSONS)
                        .then(function () {
                            console.log("Lessons collection seeded successfully");
                        });
                }
            })
            .then(resolve)
            .catch(reject);
    });
}

// GET all lessons
app.get("/lessons", function (req, res) {
    db.collection(LESSONS_COLLECTION)
        .find()
        .toArray()
        .then(function (lessons) {
            res.status(200).json(lessons);
        })
        .catch(function (err) {
            console.error("Error retrieving lessons:", err);
            res.status(500).json({
                error: "Failed to retrieve lessons"
            });
        });
});

// Render dynamically assigns the port
var PORT = process.env.PORT || 3000;

// Start server after MongoDB connection
connectToMongoDB()
    .then(function () {
        app.listen(PORT, "0.0.0.0", function () {
            console.log("App started on port " + PORT);
        });
    })
    .catch(function (err) {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    });
