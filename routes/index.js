const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const University = require('../models/University');
const Job = require('../models/Job').Job;
const Category = require('../models/Job').Category;
const Employer = require('../models/Employer');
const crypto = require('crypto');
const async = require('async');

const { ensureAuthenticated, ensureNotAuthenticated } = require('../config/auth');
router.get('/', ensureNotAuthenticated, (req, res) => {
    res.render('index', { titleName: 'Anasayfa', email: req.session.email });});

router.get('/iletisim', (req, res) => {
    res.render('contact', { email: req.session.email });
});

//İletişim Posta gönderimi
router.post('/iletisim', (req, res, next) => {
    const { username, mail, subject, message } = req.body;
    if(username!= '' && mail!= '' && subject!= '' && message!= ''){
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'freelanceprojesi@gmail.com',
                pass: '9254586yusuf'
            }
        });

        var mailOptions = {
            from: username +' <freelanceprojesi@gmail.com>', 
            to: 'freelanceprojesi@gmail.comz ',
            subject: subject, 
            text: message, 
            html: '<p>' + message + '</p><p>' + mail +'</p>' 
        };

        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log(error);
                res.redirect('/iletisim');
            }
            res.redirect('/iletisim');
        });
    }
    else{
        res.render('contact', { errMsg: 'Lütfen tüm alanları doldurunuz!', email: req.session.email });
    }

});

module.exports = router;