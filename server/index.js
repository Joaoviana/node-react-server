// server/index.js
const express = require("express");
const mongoose = require("mongoose");

const Boom  = require("@hapi/boom");

// Assign environment variables
const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/test";

/**
 * Setup services
 */

// Initiliase an express server
const app = express();

// validation middleware 

const bodyParser = (req, res, next) => {
    if (req.method === "POST") {
        let allTheData = "";
        req.on("data", (chunk) => {
            allTheData += chunk;
        });
        req.on("end", () => {
            try {
                req.body = JSON.parse(allTheData);
                next();
            }
            catch(err) {
                next(Boom.badRequest("POST request sent with invalid data. Could not parse into JSON")); // this means, 'good', next thing
            }
        });
    } else {
        next();
    }
}; 

app.use(bodyParser);


// Options to pass to mongodb to avoid deprecation warnings
const options = {
    useNewUrlParser: true
};

// Function to connect to the database
const conn = () => {
    mongoose.connect(mongoUri, options);
};
// Call it to connect
conn();

// Handle the database connection and retry as needed
const db = mongoose.connection;
db.on("error", (err) => {
    console.log("There was a problem connecting to mongo: ", err);
    console.log("Trying again");
    setTimeout(() => conn(), 5000);
});
db.once("open", () => console.log("Successfully connected to mongo"));

// Setup routes to respond to client
app.get("/welcome", async (req, res) => {
    console.log("Client request received");
    const user = await User.find().exec();
    console.log(user[0].name);
    res.send(
        `Hello Client! There is one record in the database for ${user[0].name}`
    );
});

// can add middleware to a handler
// app.post('/endpoint', middleWare, async(req, res))

app.post("/data", async (req, res) => {
   
    res.send(`received  message: ${req.body.message}`);
});


const errorHandler = (err, req, res) => {
    res.status(err.output.payload.statusCode).send(err.output.payload.message);
};

app.use(errorHandler);

// Setup a record in the database to retrieve
const { Schema } = mongoose;
const userSchema = new Schema(
    {
        name: String
    },
    {
        timestamps: true
    }
);
const User = mongoose.model("User", userSchema);
const user = new User({ name: "Big Bill Brown" });
user.save()
    .then((user) => console.log(`${user.name} saved to the database`))
    .catch((err) => console.log(err));


app.listen(port, () => console.log(`Listening on port ${port}`));
