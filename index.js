const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient;
const admin = require('firebase-admin')
const serviceAccount = require("./configs/burj-al-arab-fd00d-firebase-adminsdk-k7kfw-ffa71ec075.json");
require('dotenv').config()
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q3vod.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});
const app = express()
app.use(cors())
app.use(bodyParser.json())





client.connect(err => {
    const bookings = client.db("burjAlArab").collection("bookings");

    // send data to database

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        console.log(newBooking)
        bookings.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    // receive data from database

    app.get("/bookings", (req, res) => {
        // console.log(req.query.email)
        // console.log(req.headers.authorization)

        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            console.log({ idToken })
            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    console.log(tokenEmail, queryEmail)
                    if (tokenEmail == queryEmail) {
                        bookings.find({ email: req.query.email })
                            .toArray((err, documents) => {
                                res.status(200).send(documents)
                            })
                    }
                    else {
                        res.status(401).send("Unauthorized access")
                    }
                })
                .catch((error) => {
                    res.status(401).send("Unauthorized access")
                });
        }
        else {
            res.status(401).send("Unauthorized access")
        }
        // idToken comes from the client app
    })
});

app.listen(4500, () => { console.log("Thank You for using port 4500 😍😍😍") })