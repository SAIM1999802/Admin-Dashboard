const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false, // 587 ke liye false, 465 ke liye true
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // App Password
  },
});

const sendOrderEmail = async (customerEmail, orderData) => {
  const mailOptions = {
    from: `"Velure" <${process.env.SMTP_USER}>`,
    to: customerEmail,
    subject: `Order Confirmation - Order #${orderData.id || orderData.insertId || "CONFIRMED"}`,
    html: `
      <h2>Order Confirmation</h2>
      <p>Dear <strong>${orderData.customerName}</strong>,</p>
      <p>Thank you for your order! Your order has been placed successfully.</p>
      
      <h3>Order Summary:</h3>
      <p><strong>Total Amount:</strong> $${orderData.totalAmount}</p>
      <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
      <p><strong>Shipping Address:</strong> ${orderData.shippingAddress || "N/A"}</p>
      
      <p>We will notify you once your order is shipped.</p>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = { sendOrderEmail };