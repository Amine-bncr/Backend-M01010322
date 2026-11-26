require("dotenv").config({ path: "./config.env" });

var express = require("express");
var cors = require("cors");
var path = require("path");
var { MongoClient, ObjectId } = require("mongodb");


var app = express();

// ---------- Config ----------
var mongoUri =
    process.env.MONGODB_PREFIX +
    process.env.MONGODB_USERNAME + ":" +
    process.env.MONGODB_PASSWORD +
    process.env.MONGODB_URL;

var DB_NAME = "CourseworkDB";
var LESSONS_COLLECTION = "Lessons";
var ORDERS_COLLECTION = "Orders";
var PORT = process.env.PORT || 3000;

var SEED_LESSONS = [
    { Id: "CST3144", subject: "Full Stack Development", location: "Room 101", price: 10, availability: 5, image: "full-stack.jpg" },
    { Id: "CST3145", subject: "Business Intelligence", location: "Room 102", price: 20, availability: 5, image: "business-intelligence.jpg" },
    { Id: "CST3146", subject: "AI", location: "Room 103", price: 10, availability: 5, image: "ai.jpg" }
];

var client;
var db;

// ---------- Middleware (order matters) ----------
app.use(cors());
app.use(express.json());

// 1. Logger: first, so every request is logged
app.use(function (req, res, next) {
    console.log(new Date().toISOString() + " | " + req.method + " " + req.url);
    next();
});

// ---------- Routes ----------
// GET: retrieve all lessons
app.get("/lessons", function (req, res) {
    db.collection(LESSONS_COLLECTION)
        .find()
        .toArray()
        .then(function (lessons) {
            res.status(200).json(lessons);
        })
        .catch(function (err) {
            console.error("Error retrieving lessons:", err);
            res.status(500).json({ error: "Failed to retrieve lessons" });
        });
});

// POST: save a new order
app.post("/orders", async function (req, res) {
    try {
        const result = await db.collection("Orders").insertOne(req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error("Error saving order:", err);
        res.status(500).json({ error: "Failed to save order" });
    }
});

// PUT: update any field(s) of a lesson
app.put("/lessons/:id", async function (req, res) {
    try {
        const result = await db.collection(LESSONS_COLLECTION).updateOne(
            { Id: req.params.id },
            {
                $set: {
                    availability: Number(req.body.availability)
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                error: "Lesson not found"
            });
        }

        res.status(200).json({
            message: "Lesson updated successfully",
            result: result
        });

    } catch (err) {
        console.error("Error updating lesson:", err);
        res.status(500).json({
            error: "Failed to update lesson",
            details: err.message
        });
    }
});

// DELETE: delete a lesson by Id
app.delete("/orders/:id", async function (req, res) {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                error: "Invalid order ID"
            });
        }

        const result = await db.collection(ORDERS_COLLECTION).deleteOne({
            _id: new ObjectId(req.params.id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                error: "Order not found"
            });
        }

        res.status(200).json({
            message: "Order deleted successfully",
            result: result
        });

    } catch (err) {
        console.error("Error deleting order:", err);
        res.status(500).json({
            error: "Failed to delete order"
        });
    }
});


// ---------- Static images ----------
// 2. Serves the file if it exists, otherwise falls through to the next handler
app.use("/images", express.static(path.resolve(__dirname, "images")));

// 3. Image not found
app.use("/images", function (req, res) {
    res.status(404).send("Image not found");
});

// 4. Final 404 for any other unknown route
app.use(function (req, res) {
    res.status(404).send("Page not found");
});

// ---------- MongoDB connection and startup ----------
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