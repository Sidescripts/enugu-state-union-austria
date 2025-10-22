// config/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // Or use another service like SendGrid
    auth: {
        user: process.env.EMAIL_USER, // Set in .env (e.g., your Gmail address)
        pass: process.env.EMAIL_PASS, // Set in .env (e.g., Gmail App Password)
    },
});

module.exports = transporter;


