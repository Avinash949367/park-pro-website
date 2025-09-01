const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');

// Get all contacts
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: contacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching contacts',
      error: error.message
    });
  }
};

// Get contact by ID
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching contact',
      error: error.message
    });
  }
};

// Create new contact
exports.createContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    const newContact = new Contact({
      name,
      email,
      phone,
      subject,
      message
    });

    const savedContact = await newContact.save();

    res.status(201).json({
      success: true,
      message: 'Contact submitted successfully',
      data: savedContact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating contact',
      error: error.message
    });
  }
};

// Update contact (for replying)
exports.updateContact = async (req, res) => {
  try {
    const { reply } = req.body;

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    contact.reply = reply;
    contact.status = 'replied';
    contact.repliedAt = new Date();

    const updatedContact = await contact.save();

    // Send email reply
    await sendReplyEmail(contact.email, contact.name, reply, contact.message, contact.subject);

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      data: updatedContact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating contact',
      error: error.message
    });
  }
};

// Delete contact
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting contact',
      error: error.message
    });
  }
};

const sendReplyEmail = async (toEmail, name, reply, originalMessage, subject) => {
  try {
    // Create transporter (you'll need to configure this with your email service)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: `Reply to your inquiry: ${subject} - ParkPro+`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #46949d;">Hello ${name},</h2>
          <p>Thank you for contacting ParkPro+. Here's our response to your inquiry:</p>

          <div style="background-color: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #46949d;">
            <h3 style="margin: 0 0 10px 0; color: #46949d; font-size: 16px;">Your Original Message:</h3>
            <p style="margin: 0; line-height: 1.6; color: #333;">${originalMessage}</p>
          </div>

          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #46949d; font-size: 16px;">Our Response:</h3>
            <p style="margin: 0; line-height: 1.6;">${reply}</p>
          </div>

          <p>If you have any further questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>ParkPro+ Support Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw error to avoid breaking the update process
  }
};
