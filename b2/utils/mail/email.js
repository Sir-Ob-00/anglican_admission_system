// email utility functions

// importing necessary modules
const nodemailer = require('nodemailer');
require('dotenv').config();
const AppError = require('../errors/AppError');


// creating a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});



// creating a mail options object
const mailOptions = (to, subject, text) => {

    // Including text in HTML format for better email formatting
    const html = `<p>${text}</p>`;

    // checking if the to parameter is an array or not
    if (Array.isArray(to)) {
        to = to.join(', ');
    }


    return {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: html
    }
}



// function to send an email
const sendEmail = async (to, subject, text) => {
    try {
        const options = mailOptions(to, subject, text);
        await transporter.sendMail(options);
    } catch (err) {
        throw new AppError('Failed to send email', 500);
    }
}


module.exports = {
    sendEmail
}