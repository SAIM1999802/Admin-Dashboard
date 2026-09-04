const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./config/db");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const customerRoutes = require("./routes/customerRoutes");
const paymentRoute = require("./routes/paymentRoutes");
const app = express();

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

//Authorization api
app.use("/api/auth", authRoutes);
//Product api
app.use("/api/products", productRoutes);
//Order api
app.use('/api/orders',orderRoutes)
//Customer api
app.use('/api/customers', customerRoutes);
//Payment api
app.use('/api/payment',paymentRoute)

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} .`);
});