const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { upload, sendImageToImageKit } = require('./imageUploadHandle');
const SSLCommerzPayment = require('sslcommerz-lts');
require('dotenv').config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());


const store_id = process.env.SSL_STORE_ID
const store_passwd = process.env.SSL_STORE_PASSWORD
const is_live = false


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


        const toolsDataCollection = client.db("Builder_Tools").collection("tools");
        const usersCollection = client.db("Builder_Tools").collection("users");
        const blogsCollection = client.db("Builder_Tools").collection("blogs");
        const ordersCollection = client.db("Builder_Tools").collection("orders");
        const reviewsCollection = client.db("Builder_Tools").collection("reviews");

        // jwt token create and pass for general user create and login
        app.post('/api/v1/jwt', async (req, res) => {
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
        app.get('/api/v1/users/:email', async (req, res) => {
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
        app.post('/api/v1/users', async (req, res) => {
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
                await toolsDataCollection.insertOne({ ...data, img: photoUrl, isDeleted: false });
                res.status(200).json({
                    success: true,
                    message: 'Successfully added tool'
                });
            } catch (error) {
                console.log(error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to add tool',
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



        // order section
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
                    await ordersCollection.insertOne({ ...req.body, isDeleted: false, isConfirmed: false, isReOrder: false, isOrder: false, isPaid: false, transactionId: "" });
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

        app.get('/api/v1/order/:id', async (req, res) => {
            const { id } = req.params;
            const result = await ordersCollection.findOne({ _id: new ObjectId(`${id}`) });
            if (result) {
                const tool = await toolsDataCollection.findOne({ _id: new ObjectId(result.toolId) });
                result.toolId = tool;
            }
            res.send(result);
        });

        app.get('/api/v1/order/specific-user/single-order', async (req, res) => {
            const result = await ordersCollection.findOne(req.query);
            if (result) {
                const tool = await toolsDataCollection.findOne({ _id: new ObjectId(result.toolId) });
                result.toolId = tool;
            }
            res.send(result);
        });

        app.get('/api/v1/order/specific-user/all-orders', async (req, res) => {
            try {
                const orders = await ordersCollection.find(req.query).toArray();

                const populatedOrders = await Promise.all(orders.map(async (order) => {
                    if (order.toolId && ObjectId.isValid(order.toolId)) {
                        const tool = await toolsDataCollection.findOne({ _id: new ObjectId(order.toolId) });
                        order.toolId = tool;
                    } else {
                        order.toolId = null;
                    }
                    return order;
                }));

                res.send(populatedOrders);
            } catch (error) {
                res.status(500).send({ message: 'Server error', error: error.message });
            }
        });

        app.post('/api/v1/order/payment', async (req, res) => {
            const data = req.body;
            const tranId = new ObjectId().toString();
            const order = await ordersCollection.findOne({ _id: new ObjectId(`${data?.id}`) });
            if (order) {
                const tool = await toolsDataCollection.findOne({ _id: new ObjectId(order.toolId) });
                order.toolId = tool;
            }
            try {
                const data = {
                    total_amount: (Number(order?.quantity) * Number(order?.toolId?.price)),
                    currency: 'BDT',
                    tran_id: tranId,
                    success_url: `${process.env.SERVER_SIDE_URL || 'http://localhost:8080'}/api/v1/order/payment/success?orderId=${order?._id}&transId=${tranId}`,
                    fail_url: `${process.env.SERVER_SIDE_URL || 'http://localhost:8080'}/api/v1/order/payment/failed?orderId=${order?._id}&transId=${tranId}`,
                    cancel_url: `${process.env.SERVER_SIDE_URL || 'http://localhost:8080'}/api/v1/order/payment/cancel`,
                    ipn_url: `${process.env.SERVER_SIDE_URL || 'http://localhost:8080'}/api/v1/order/payment/cancel`,
                    shipping_method: 'Courier',
                    product_name: order?.toolId?.heading,
                    product_category: order?.toolId?.category,
                    product_profile: 'general',
                    cus_name: 'Customer Name',
                    cus_email: order?.email,
                    cus_add1: order?.location,
                    cus_add2: 'Dhaka',
                    cus_city: 'Dhaka',
                    cus_state: 'Dhaka',
                    cus_postcode: '1000',
                    cus_country: 'Bangladesh',
                    cus_phone: order?.mobileNo,
                    cus_fax: '01711111111',
                    ship_name: 'Customer Name',
                    ship_add1: order?.location,
                    ship_add2: 'Dhaka',
                    ship_city: 'Dhaka',
                    ship_state: 'Dhaka',
                    ship_postcode: 1000,
                    ship_country: 'Bangladesh',
                };
                const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
                sslcz.init(data).then(apiResponse => {
                    // Redirect the user to payment gateway
                    let GatewayPageURL = apiResponse.GatewayPageURL
                    res.send({ url: GatewayPageURL });
                });
            } catch (error) {
                res.status(500).send({ message: 'Server error', error: error.message });
            }
        });

        app.post('/api/v1/order/payment/success', async (req, res) => {
            const data = req.query;
            try {
                const result = await ordersCollection.updateOne({ _id: new ObjectId(`${data.orderId}`) }, {
                    $set: {
                        isPaid: true,
                        transactionId: data.transId
                    }
                });
                if (result.modifiedCount > 0) {
                    res.redirect(`${process.env.CLIENT_SIDE_URL || 'http://localhost:5173'}/checkout/${data.orderId}/payment/success`);
                }
                else {
                    res.redirect(`${process.env.CLIENT_SIDE_URL || 'http://localhost:5173'}`);
                }
            } catch (error) {
                res.status(500).send({ message: 'Server error', error: error.message });
            }
        });

        app.post('/api/v1/order/payment/failed', async (req, res) => {
            const data = req.query;
            try {
                res.redirect(`${process.env.CLIENT_SIDE_URL || 'http://localhost:5173'}/checkout/${data.orderId}/payment/failed`);
            } catch (error) {
                res.status(500).send({ message: 'Server error', error: error.message });
            }
        });

        app.post('/api/v1/order/payment/cancel', async (req, res) => {
            const data = req.query;
            try {
                res.redirect(`${process.env.CLIENT_SIDE_URL || 'http://localhost:5173'}`);
            } catch (error) {
                res.status(500).send({ message: 'Server error', error: error.message });
            }
        });



        // review section
        app.post('/api/v1/review', async (req, res) => {
            try {
                const data = req.body;
                await reviewsCollection.insertOne({ ...req.body, isDeleted: false });
                res.status(201).json({
                    success: true,
                    message: 'Successfully added review'
                });

            } catch (error) {
                console.log(error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to add review',
                    error: {
                        code: 500,
                        description: error?.message,
                    }
                });
            }
        });

        app.get('/api/v1/reviews', async (req, res) => {
            const result = await reviewsCollection.find().toArray();
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