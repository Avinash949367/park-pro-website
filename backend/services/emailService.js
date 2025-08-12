const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'parkproplus@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Send approval email
const sendApprovalEmail = async (toEmail, userName) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'parkproplus@gmail.com',
            to: toEmail,
            subject: 'Registration Approved - ParkPro',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #46949d;">Registration Approved!</h2>
                    <p>Dear ${userName},</p>
                    <p>Great news! Your registration has been approved and is ready for the documentation process.</p>
                    <p>Next steps:</p>
                    <ol>
                        <li>Check your email for documentation requirements</li>
                        <li>Complete the document submission process</li>
                        <li>Start listing your parking spots</li>
                    </ol>
                    <p>Thank you for choosing ParkPro!</p>
                    <p>Best regards,<br>The ParkPro Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Approval email sent successfully to:', toEmail);
        return true;
    } catch (error) {
        console.error('Error sending approval email:', error);
        return false;
    }
};

// Send rejection email
const sendRejectionEmail = async (toEmail, userName, reason) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'parkproplus@gmail.com',
            to: toEmail,
            subject: 'Registration Update - ParkPro',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #46949d;">Registration Update</h2>
                    <p>Dear ${userName},</p>
                    <p>We regret to inform you that your registration has been rejected.</p>
                    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                    <p>If you believe this is an error, please contact our support team.</p>
                    <p>Best regards,<br>The ParkPro Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Rejection email sent successfully to:', toEmail);
        return true;
    } catch (error) {
        console.error('Error sending rejection email:', error);
        return false;
    }
};

module.exports = {
    sendApprovalEmail,
    sendRejectionEmail
};
