const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.03hem.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");


        const toolsDataCollection = client.db("Builder_Tools").collection("Tools_Data");
        const usersCollection = client.db("Builder_Tools").collection("users");

        // jwt token create and pass for general user create and login
        app.post('/jwt', async (req, res) => {
            try {
                const user = req.body;
                const token = jwt.sign(user, process.env.COOKIE_SECRET, { expiresIn: '30d' });
                res.status(200).json({
                    success: true,
                    data: token,
                });
            } catch (err) {
                res.status(500).json({
                    success: false,
                    message: err.message,
                    error: {
                        code: 500,
                        description: err.name,
                    }
                });
            }
        })

        // get all data
        app.get('/api/v1/tools', async (req, res) => {
            const result = await toolsDataCollection.find().toArray();
            res.send(result);
        });

        // get single user after login from firebase --> complete token
        app.get('/users/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const query = { email: email };
                const result = await usersCollection.findOne(query);
                res.status(200).json({
                    success: true,
                    data: result
                });
            } catch (err) {
                res.status(500).json({
                    success: false,
                    message: err.message,
                    error: {
                        code: 500,
                        description: err.name,
                    }
                });
            }
        })

        // post single user data
        app.post('/users', async (req, res) => {
            const query = { email: req.body.email };
            const isExist = await usersCollection.findOne(query);
            if (isExist) {
                res.status(200).json({
                    success: true,
                    message: 'User already exist.'
                });
            }
            else {
                await usersCollection.insertOne({ ...req.body, role: 'user' });
                res.status(200).json({
                    success: true,
                    message: 'Successfully added user'
                });
            }
        });

        // get all user from admin side
        app.get('/api/v1/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });



    }

    finally {
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Builder tools Server Running');
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});