// emailTest.js
//require('dotenv').config(); // Load .env file
const nodemailer = require('nodemailer');

// 1. Setup transporter using Gmail and App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'davinash46479@gmail.com',         // e.g., davinash46479@gmail.com
    pass: 'yygq zhjk pykh ntci'          // e.g., App Password like 'yygq zhjk pykh ntci'
  }
});

// 2. Mail options
const mailOptions = {
  from: process.env.EMAIL_USER,
  to: 'avinash46479@gmail.com', // 🔁 Replace with any test email address you have access to
  subject: 'Test Email from Node.js',
  text: 'Hello World from ParkPro system 🚗'
};

// 3. Send mail
async function sendTestEmail() {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.response);
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
}

sendTestEmail();
