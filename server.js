require("dotenv").config({ path: "./config.env" });

var express = require("express");
var cors = require("cors");
var { MongoClient } = require("mongodb");

var app = express();
app.use(cors());

// Build the MongoDB connection string from environment variables (config.env).
// Credentials are never hard-coded in this file.
var mongoUri =
    process.env.MONGODB_PREFIX +
    process.env.MONGODB_USERNAME + ":" +
    process.env.MONGODB_PASSWORD +
    process.env.MONGODB_URL;

var DB_NAME = "CourseworkDB";
var LESSONS_COLLECTION = "Lessons";

// The three lessons that were previously hard-coded in this file.
// They are used to seed the Lessons collection on first run only.
var SEED_LESSONS = [
    { Id: "CST3144", subject: "Full Stack Development", Location: "Room 101", price: 10, availibility: 5 },
    { Id: "CST3145", subject: "Business Intelligence", Location: "Room 102", price: 20, availibility: 5 },
    { Id: "CST3146", subject: "AI", Location: "Room 103", price: 10, availibility: 5 }
];

var client;
var db;

function connectToMongoDB() {
    return new Promise(function (resolve, reject) {
        try {
            client = new MongoClient(mongoUri);
            client.connect().then(function () {
                db = client.db(DB_NAME);
                console.log("Successfully connected to MongoDB (CourseworkDB)");

                // Seed the Lessons collection on first run only, so the existing
                // lesson documents are never overwritten or deleted.
                return db.collection(LESSONS_COLLECTION).countDocuments();
            }).then(function (count) {
                if (count === 0) {
                    return db.collection(LESSONS_COLLECTION).insertMany(SEED_LESSONS).then(function () {
                        console.log("Seeded Lessons collection with " + SEED_LESSONS.length + " lessons");
                    });
                }
            }).then(function () {
                resolve();
            }).catch(function (err) {
                reject(err);
            });
        } catch (err) {
            reject(err);
        }
    });
}

// GET /lessons - retrieve all lesson documents from the Lessons collection.
// The existing property names (Id, subject, Location, price, availibility)
// are preserved because documents are returned as stored.
app.get("/lessons", function (req, res) {
    db.collection(LESSONS_COLLECTION).find().toArray()
        .then(function (lessons) {
            res.status(200).json(lessons);
        })
        .catch(function (err) {
            console.error("Error retrieving lessons:", err);
            res.status(500).json({ error: "Failed to retrieve lessons" });
        });
});

// The Orders collection is kept available for future coursework functionality.
// Access it later with: db.collection("Orders")

var PORT = process.env.PORT || 3000;

// Start the Express server only after MongoDB is connected.
connectToMongoDB().then(function () {
    app.listen(PORT, function () {
        console.log("App started on port " + PORT);
    });
}).catch(function (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
});