require('dotenv').config();
const express = require('express');
const router = express.Router()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/create-payment-intent',async(req,res)=>{
    try {
        const {amount} = req.body

        const paymentIntent = await stripe.paymentIntent.create({
            amount:amount*100,
            currency:'usd',
            payment_method_typs:['card']
        })

        res.status(200).json({clienSecret:paymentIntent.client_secret})
    } catch (e) {
        res.status(500).json({error:e.message})
    }
})

module.exports = router