const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const University = require('../models/University');
const Job = require('../models/Job').Job;
const Employer = require('../models/Employer');
const ValToken = require('../models/ValidateToken');
const crypto = require('crypto');
const async = require('async');

const { ensureAuthenticated, ensureNotAuthenticated } = require('../config/auth');

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'freelanceprojesi@gmail.com',
        pass: '9254586yusuf'
    }
});

router.get('/signup_is', ensureNotAuthenticated, (req, res) => {
    res.render('employer/esignup');
});

router.get('/reset/:token', ensureNotAuthenticated, (req, res) => {
    Employer.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
            req.flash('error_msg', 'Şifre değiştirme süreniz dolmuştur!');
            return res.redirect('/user/sifre_unuttum');
        }
        res.render('employer/resetPass', { token: req.params.token, });
    });
});

router.get('/profil/:username', (req, res) => {
    Employer.findOne({ username: req.params.username }, (err, data) => {
        res.render('employer/prof', { data: data, email: req.session.email });    
    });
});

router.get('/bilgi_guncelle', ensureAuthenticated, (req, res) => {
    let username = undefined,
        password = undefined,
        deger = undefined;
    Employer.findOne({ email: req.session.email }, {}, (err, data) => {
        username = data.username;
        password = data.password;
    }).then( () => {
        res.render('employer/profileUpdate', {
            email: req.session.email, username, password
        });
    });
});

router.post('/signup_is', (req, res) => {
    let { username, password, passwordCheck, mail } = req.body;
    let errors = [];
    if(!username || !password || !passwordCheck || !mail){
        errors.push({message: 'Lütfen boş alan bırakmayınız'});
    }
    else if(password.length < 6){
        errors.push({message: 'Şifreniz 6 karakterden fazla olmalıdır.'});
    }
    else if(password !== passwordCheck){
        errors.push({message: 'Şifreler eşleşmiyor'});
    }
    else if(mail.includes('edu.tr')){
        errors.push({message: 'Mail adresiniz edu.tr ile bitemez'});
    }
    if(errors.length > 0){
        res.render('employer/esignup', {
            errors,
            username,
            password,
            passwordCheck,
            mail,
            email: req.session.email
        });
    }
    else{
        Employer.findOne({ email: mail }).then( user => {
            if(user){
                //Kullanıcı mevcut
                errors.push({message: 'Bu email\'e sahip bir kullanıcı var'});
                res.render('employer/esignup', {
                    errors,
                    username,
                    password,
                    passwordCheck,
                    mail,
                    email: req.session.email
                });
            }
        }).then(() => {
            Employer.findOne({ username: username }).then( user => {
                if(user){
                    errors.push({message: 'Bu kullanıcı adı alınmış'});
                    res.render('employer/esignup', {
                        errors,
                        username,
                        password,
                        passwordCheck,
                        mail,
                        email: req.session.email
                    });
                }
                else{
                    const newEmp = new Employer({
                        username,
                        password,
                        email: mail,
                        date: Date.now()
                    });
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newEmp.password, salt, (err, hash) => {
                            if(err)
                                throw err;
                            newEmp.password = hash;
                            newEmp.save().then( user => {
                                const newToken = new ValToken({
                                    _userId: user.id, token: crypto.randomBytes(16).toString('hex')
                                })
                                newToken.save().then(() => {
                                    var mailOptions = {
                                        from:' <freelanceprojesi@gmail.com>', 
                                        to: mail,
                                        subject: 'Hesap Doğrulama', 
                                        text: 'Merhaba,\n\n' + 'Lütfen hesabınızı aşağıdaki ' + 
                                        'linke tıklayarak doğrulayınız: \nhttp:\/\/' + req.headers.host + 
                                        '\/user\/confirm\/emp\/' + newToken.token + '.\n'
                                    };

                                    transporter.sendMail(mailOptions, function(error, info){
                                        if(error){
                                            console.log(error);
                                            res.redirect('/employer/signup_is');
                                        }
                                        res.redirect('/user/login');
                                    });
                                })
                            }).then(() => {
                                req.flash('success_msg', 'Kaydınız tamamlandı giriş yapabilirsiniz');
                                res.redirect('/user/login');     
                            }).catch((err) => console.log(err));
                        })
                    })
                }
            }).catch((err) => {
                console.log(err);
            });
        }).catch(()=>{});
    }
});

router.post('/bilgi_guncelle', ensureAuthenticated, (req, res) => {
    let { username, password, email } = req.body;
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, (err, hash) => {
            if(err)
                throw err;
            password = hash;
            Employer.findOneAndUpdate( { email: req.session.email }, {
                username, password, email
            }).then( () => {
                res.redirect('/user/profile');
            }).catch((err) => {
                console.log(err);
            })
        });
    });
});

router.post('/reset/:token', ensureNotAuthenticated, (req, res) => {
    let { password, passwordCheck } = req.body;
    let errors = [];
    if(password !== passwordCheck){
        errors.push({ message: 'Şifreler eşleşmiyor!' });
    }
    if(password.length<6){
        errors.push({ message: 'Şifreniz 6 karakterden daha fazla olmalıdır!' });
    }
    else{
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, (err, hash) => {
                if(err)
                    throw err;
                password = hash;
                //console.log(req.params);
                //console.log(req.body);
                Employer.findOneAndUpdate( { resetPasswordToken: req.params.token },{
                    password,
                    resetPasswordExpires: undefined,
                    resetPasswordToken: undefined
                }).then(() => {
                    res.redirect('/user/login');
                }).catch((err) => {
                    console.log(err);
                });

            });});
    }
});

module.exports = router;