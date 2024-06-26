const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { upload, sendImageToImageKit } = require('./imageUploadHandle');
require('dotenv').config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());


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
        const blogsCollection = client.db("Builder_Tools").collection("blogs");
        const ordersCollection = client.db("Builder_Tools").collection("orders");

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
                const query = { email: email, isDeleted: { $ne: true } };
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
                await usersCollection.insertOne({ ...req.body, role: 'user', isDeleted: false });
                res.status(200).json({
                    success: true,
                    message: 'Successfully added user'
                });
            }
        });

        // get all user from admin side
        app.get('/api/v1/users', async (req, res) => {
            const result = await usersCollection.find({ isDeleted: { $ne: true } }).toArray();
            res.send(result);
        });

        // get all user from admin side
        app.patch('/api/v1/user/:id', async (req, res) => {
            const { id } = req.params;
            const data = req.body;
            const result = await usersCollection.updateOne({ _id: new ObjectId(`${id}`) }, { $set: data }, { upsert: false });
            res.send(result);
        });

        // get all user from admin side
        app.delete('/api/v1/user/:id', async (req, res) => {
            const { id } = req.params;
            const result = await usersCollection.updateOne({ _id: new ObjectId(`${id}`) }, { $set: { isDeleted: true } }, { upsert: false });
            res.send(result);
        });


        // get all user from admin side
        app.post('/api/v1/blog', upload.single("file"), async (req, res) => {
            try {
                const data = JSON.parse(req.body.data);
                const photoUrl = await sendImageToImageKit(req.file.filename, `Builder_tools/Blogs`, req.file.path);
                await blogsCollection.insertOne({ ...data, photoUrl: photoUrl, isDeleted: false });
                res.status(200).json({
                    success: true,
                    message: 'Successfully added blog'
                });
            } catch (error) {
                console.log(error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to add blog',
                    error: {
                        code: 500,
                        description: error?.message,
                    }
                });

            }
        });

        app.get('/api/v1/blogs', async (req, res) => {
            const result = await blogsCollection.find().toArray();
            res.send(result);
        });

        app.get('/api/v1/blog/:id', async (req, res) => {
            const { id } = req.params;
            const result = await blogsCollection.findOne({ _id: new ObjectId(`${id}`) });
            res.send(result);
        });

        app.post('/api/v1/tool', upload.single("file"), async (req, res) => {
            try {
                const data = JSON.parse(req.body.data);
                const photoUrl = await sendImageToImageKit(req.file.filename, `Builder_tools/Tools`, req.file.path);
                await toolsDataCollection.insertOne({ ...data, photoUrl: photoUrl, isDeleted: false });
                res.status(200).json({
                    success: true,
                    message: 'Successfully added blog'
                });
            } catch (error) {
                console.log(error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to add blog',
                    error: {
                        code: 500,
                        description: error?.message,
                    }
                });

            }
        });

        app.get('/api/v1/tool/:id', async (req, res) => {
            const { id } = req.params;
            const result = await toolsDataCollection.findOne({ _id: new ObjectId(`${id}`) });
            res.send(result);
        });


        app.post('/api/v1/order', async (req, res) => {
            try {
                const data = req.body;
                const isExist = await ordersCollection.findOne({ email: data.email, toolId: data.toolId });
                if (isExist) {
                    res.status(409).json({
                        success: true,
                        message: 'The order is already added'
                    });
                }
                else {
                    await ordersCollection.insertOne({ ...req.body, isDeleted: false, isConfirmed: false, isReOrder: false, isOrder: false });
                    res.status(201).json({
                        success: true,
                        message: 'Successfully added order'
                    });
                }

            } catch (error) {
                console.log(error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to add blog',
                    error: {
                        code: 500,
                        description: error?.message,
                    }
                });

            }
        });

        app.get('/api/v1/order', async (req, res) => {
            const result = await ordersCollection.findOne(req.query);
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