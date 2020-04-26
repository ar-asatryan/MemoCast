// setup mail client
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');

const settings = require('../../Common/settings');

// path to dir with templates
const templatePath = path.join(__dirname, "templates");
// handlebars options
const hbsOptions = {
    "viewEngine": "express-handlebars",
    "viewPath": templatePath,
    "extName": ".handlebars"
};

// const transporter = nodemailer.createTransport(
//     settings.mailer.auth,
//     settings.mailer.defaults
// );

// console.log('<<<<<<Transporter>>', transporter)

const transporter = nodemailer.createTransport(
    {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use SSL
        auth: {
            user: 'info@memocast.com',
            pass: '4z7zn5r2pR3Y946'
        },
        defaults: {
            "from":"info@memocast.com",
            "to": "leoaroray@gmail.com"
        },
    },
);

transporter.use('compile', hbs(hbsOptions));
//console.log('<<<<<<Transporter 2>>', transporter)

module.exports = async (mail) => {
    try {
        const result = await transporter.sendMail(mail);
        return result;
    } catch (err) {
        throw err;
    }
};