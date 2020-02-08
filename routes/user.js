const express = require('express');
const app = express();
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const University = require('../models/University');
const Job = require('../models/Job').Job;
const Category = require('../models/Job').Category;
const Employer = require('../models/Employer');
const ValToken = require('../models/ValidateToken');
const crypto = require('crypto');
const async = require('async');
const multer = require('multer');
const Binary = require('mongodb').MongoClient.Binary;
const fs = require('fs');

const { ensureAuthenticated, ensureNotAuthenticated } = require('../config/auth');

router.get('/', ensureAuthenticated, (req, res) => {
    res.redirect('/user/profile');
});
let Collection = null;
router.get('/profile', ensureAuthenticated, (req, res) => {
    req.session.name = req.user.username;
    decodedImage = typeof req.user.img != 'undefined' ? req.user.img.data : undefined;
    Collection = req.session.email.match(/edu.tr/) === null ? Employer : User;
    res.render('user/profile', {
        titleName: 'Hesabım',
        name: req.user.username,
        uniname: req.user.university,
        email: req.session.email,
        cv: req.user.cv,
        decodedImage
    });
});

//İşveren için de profil sayfasını kullan if-else ile mail sonunu bul
router.get('/login', ensureNotAuthenticated, (req, res) => {
    req.session.email = undefined;
    res.render('user/login', 
               { titleName: 'Giriş Sayfası',
                email: req.session.email })
});

router.get('/signup', ensureNotAuthenticated, (req, res) => {
    University.findOne({},{uniName: 1, _id: 0}, (err, data) => {
        if(err)
            console.log(err);
        deger = data.get('uniName');
        res.render('user/signup', 
                   { titleName: 'Kayıt Sayfası',
                    unis: {
                        deger
                    },
                    email: req.session.email
                   });
    })

});

router.get('/sifre_unuttum', ensureNotAuthenticated, (req, res) => {
    res.render('user/forgotPass', { email: req.session.email });
});

router.get('/reset/:token', ensureNotAuthenticated, (req, res) => {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
            req.flash('error_msg', 'Şifre değiştirme süreniz dolmuştur!');
            return res.redirect('/user/sifre_unuttum');
        }
        res.render('user/resetPass', { token: req.params.token, });
    });
});

//Kullanıcı(İşveren) mail doğrulama
router.get('/confirm/emp/:token', (req, res) => {
    userValidation(req.params.token, Employer, req, res);
});
//Kullanıcı(Öğrenci) mail doğrulama
router.get('/confirm/:token', (req, res) => {
    userValidation(req.params.token, User, req, res);
});
//Kullanıcı doğrulama fonksiyonu
function userValidation(token, Collection, req, res){
    ValToken.findOne( { token }, (err, userToken) => {
        if(!userToken){
            console.log('Doğrulama süresi geçmiş');
        }
        else{
            Collection.findOne({ _id: userToken._userId }, (err, data) => {
                if(data.isVerified){
                    req.flash('error_msg', 'Bu hesap zaten doğrulanmış');
                    return res.redirect('/user/login');
                }
                Collection.findOneAndUpdate({ _id: userToken._userId }, { isVerified: true }).then(() => {
                    req.flash('success_msg', 'Hesabınız doğrulandı.Giriş yapabilirsiniz');
                    return res.redirect('/user/login');
                });
            });
        }
    })
}

router.get('/bilgi_guncelle', ensureAuthenticated, (req, res) => {
    let username = undefined,
        password = undefined,
        deger = undefined,
        cv = undefined;
    User.findOne({ email: req.session.email }, {}, (err, data) => {
        username = data.username;
        password = data.password;
        cv = data.cv;
    });
    University.findOne({},{ uniName: 1, _id: 0 }, (err, data) => {
        if(err)
            console.log(err);
        deger = data.get('uniName');
    }).then( () => {
        res.render('user/profileUpdate', { email: req.session.email, username, password, unis: { deger }, cv
                                         });
    });
});

router.get('/profil/:username', (req, res) => {
    boolRate = false;
    User.findOne( { username: req.params.username }, (err, data) => {
        data.userRating.forEach((eleman) => {
            if(eleman.userMail == req.session.email)
                boolRate = true;
        });
        Job.find({ "acceptedOffer.email" : data.email }, (err, datas) => {
            res.render('user/prof', { data, email: req.session.email, jobData: datas, boolRate });   
        });
    });
});

router.get('/yeteneklerim', ensureAuthenticated, (req, res) => {
    User.findOne( { email: req.session.email }, (err, data) => {
        res.render('user/talent', { email: req.session.email, deger: data });
    });
});

router.get('/yeteneklerim/delete/:id', (req, res) => {
    User.findOneAndUpdate( { email: req.session.email }, 
                          { $pull: { "talent": { _id: req.params.id } }
                          }).then(() => {
        res.redirect('/user/yeteneklerim')
    }).catch((err) => {
        console.log(err)
    });
});

router.get('/yeteneklerim/edit/:id', (req, res) => {
    User.findOne( { email: req.session.email }, (err, data) => {
        res.render('user/talentEdit', { email: req.session.email, deger: data, id: req.params.id });
    });
});

let fileName = '';
var binaryFileData = '';
router.get('/upImg', (req, res) => {
    var binaryFileData = new Buffer(fs.readFileSync(__dirname + '/../tmp/' + fileName), 'binary').toString('base64');
    Collection.findOneAndUpdate({ email: req.session.email }, { img: {
        data: binaryFileData,
        fileName
    }}).then(() => {
        fs.unlink( __dirname + '/../tmp/' + fileName, (err) => {});
        fileName = '';
    }).then(() => {
        res.redirect('/user/profile');
    }).catch((err) => {
        console.log(err);
        res.redirect('/user/profile');   
    });
});

//Kullanıcı Girişi
router.post('/login', ensureNotAuthenticated, (req, res, next) => {
    req.session.email = req.body.email;
    if(!req.body.email || !req.body.password){
        req.flash('error_msg', 'Lütfen boş alan bırakmayınız!');
        res.redirect('/user/login');
    }
    else{
        passport.authenticate('local', {
            successRedirect: '/user/profile',
            failureRedirect: '/user/login',
            failureFlash: true
        })(req, res, next);
    }
});

//Kullanıcı kayıt işlemleri
router.post('/signup', ensureNotAuthenticated, (req, res) => {
    const {username, password, passwordCheck, mail, university, cv } = req.body;
    let errors = [];

    University.findOne({},{uniName: 1, _id: 0}, (err, data) => {
        if(err)
            console.log(err);
        deger = data.get('uniName');
    });
    //Boş alanların kontrolü
    if(!username || !mail || !password || !passwordCheck || !cv){
        errors.push({message: 'Lütfen tüm alanları doldurunuz!'});
    }
    //Şifre uzunluğu kontrolü
    else if(password.length < 6){
        errors.push({message: 'Şifreniz 6 karakterden fazla olmalıdır.'});
    }
    //Şifre eşleşme kontrolü
    else if(password != passwordCheck){
        errors.push({message: 'Şifreler eşleşmiyor'});
    }

    //Mail uzantısı kontrolü
    else if(mail.includes('edu.tr') == false){
        errors.push({message: 'Lütfen sonu edu.tr ile biten bir mail giriniz!'});
    }
    //Hataların kontrolü
    if(errors.length > 0){
        res.render('user/signup', {
            errors,
            username,
            password,
            passwordCheck,
            mail,
            unis: {
                deger  
            },
            cv,
            email: req.session.email
        });
    }
    else{
        User.findOne({ email: email}).then( user => {
            if(user){
                //Kullanıcı mevcut
                errors.push({message: 'Bu emaile sahip bir kullanıcı var'});
                res.render('user/signup', {
                    errors,
                    username,
                    password,
                    passwordCheck,
                    mail,
                    unis: {
                        deger
                    },
                    cv,
                    email: req.session.email
                });
            }}).then( () => {
            User.findOne({ username: username }).then( user => {
                if(user){
                    errors.push({message: 'Bu kullanıcı adı alınmış'});
                    res.render('user/signup', {
                        errors,
                        username,
                        password,
                        passwordCheck,
                        mail,
                        unis: {
                            deger
                        },
                        cv,
                        email: req.session.email
                    });
                }
                else{
                    const newStudent = new User({
                        username,
                        password,
                        email: mail,
                        date: Date.now(),
                        university,
                        cv
                    });
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newStudent.password, salt, (err, hash) => {
                            if(err)
                                throw err;
                            newStudent.password = hash;
                            newStudent.save().then( user => {
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
                                        '\/user\/confirm\/' + newToken.token + '.\n'
                                    };

                                    transporter.sendMail(mailOptions, function(error, info){
                                        if(error){
                                            console.log(error);
                                            res.redirect('/user/signup');
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
            })}).catch((err)=>{console.log(err)});
    }
});

router.post('/sifre_unuttum', ensureNotAuthenticated, (req, res) => {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            function forgotPass(Schema){
                Schema.findOne({ email: req.body.mail }, function(err, user) {
                    if (!user) {
                        req.flash('error_msg', 'Böyle bir email kayıtlı değil.');
                        return res.redirect('/user/sifre_unuttum');
                    }

                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000*4;

                    user.save(function(err) {
                        res.redirect('/user/login');
                        done(err, token, user);
                    });

                });    
            }
            if(req.body.mail.includes('edu.tr')){
                forgotPass(User);
            }
            else{
                forgotPass(Employer);
            }

        },
        function(token, user, done) {
            var transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'freelanceprojesi@gmail.com',
                    pass: '9254586yusuf'
                }
            });
            var mailOptions = {
                from: '<freelanceprojesi@gmail.com',
                to: user.email,
                subject: 'Şifre Sıfırlama',
                text: 'Lütfen aşağıdaki linke tıklayınız veya kopyalayarak tarayıcı üzerinden giriniz:\n\n' +
                'http://localhost:8080/' + (req.body.mail.includes('edu.tr') == true ? 'user' : 'employer') + 
                '/reset/' + token + '\n\n' +
                'Eğer isteği siz yapmadıysanız bu mesajı önemsemeyiniz.\n'
            };
            transporter.sendMail(mailOptions, function(err) {
                //console.log('mail gönderildi.');
                req.flash('success_msg', 'Şifre değiştirme talimatları adresinize gönderildi');
                done(err, 'done');
            });
        }
    ], function(err) {
        if (err) {
            console.log(err);
            res.redirect('/user/sifre_unuttum');
        }
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
                User.findOneAndUpdate( { resetPasswordToken: req.params.token },{
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

router.post('/bilgi_guncelle', ensureAuthenticated, (req, res) => {
    let { username, password, email, university, cv } = req.body;
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, (err, hash) => {
            if(err)
                throw err;
            password = hash;
            User.findOneAndUpdate( { email: req.session.email }, {
                username, password, email, university, cv
            }).then( () => {
                res.redirect('/user/profile');
            }).catch((err) => {
                console.log(err);
            })
        });
    });
});

router.post('/yeteneklerim', (req, res) => {
    let yetenekler = [];
    User.findOne({ email: req.session.email }, (err, data) => {
        yetenekler = data.talent;
    }).then(()=>{
        if(yetenekler.indexOf(req.body.talent) == -1){
            yetenekler.push({ content: req.body.talent });
            User.findOneAndUpdate( { email: req.session.email }, { talent: yetenekler }).then(() => {
                res.redirect('/user/yeteneklerim');
            })
        }
    }).catch((err) => {console.log(err)});
});

router.post('/yeteneklerim/edit/:id', (req, res) => {
    let yetenekler = [];
    User.findOne({ email: req.session.email }, (err, data) => {
        yetenekler = data.talent;
    }).then(() => {
        for(var i=0;i<yetenekler.length;i++){
            if(yetenekler[i].id === req.params.id){
                yetenekler[i].content = req.body.content;
            }
        }
    }).then(() => {
        User.findOneAndUpdate( { email: req.session.email }, { talent: yetenekler } ).then(() => {
            res.redirect('/user/yeteneklerim');
        })
    }).catch(((err) => { console.log(err)}));
});

router.post('/upImage', (req, res) => {
    if(req.files){
        var file = req.files.filename,
            filename = file.name;
        file.mv('./tmp/' + filename, (err) => {
            if(err){
                console.log(err);
                res.redirect('/user/profile');
            }
        });
        fileName = filename;
    }
});

router.post('/rate', ensureAuthenticated, (req, res) => {
    const username = req.body.username;
    User.findOne({ username }, (err, data) => {
        rates = data.userRating;
    }).then(() => {
        rates.push({
            userMail: req.session.email,
            rate: req.body.rate
        });
    }).then(() => {
        User.findOneAndUpdate( { username }, { userRating: rates } ).then(() => {
        });
    });
});
//Kullanıcı çıkışı
router.get('/logout', ensureAuthenticated, (req, res) => {
    req.logout();
    req.flash('success_msg', 'Çıkış yaptınız');
    res.redirect('/user/login');
    req.session.destroy();
});

module.exports = router;