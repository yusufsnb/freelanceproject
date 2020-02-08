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
const Binary = require('mongodb').MongoClient.Binary;
const fs = require('fs');
const fileUpload = require('express-fileupload');
const { ensureAuthenticated, ensureNotAuthenticated } = require('../config/auth');

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'freelanceprojesi@gmail.com',
        pass: '9254586yusuf'
    }
});

let fileName = '';
router.get('/is', (req, res) => {
    let done = [],
        cont = [];
    Job.find({}, (err, docs) => {
        docs.forEach((el) => {
            if(typeof el.acceptedOffer != 'undefined')
                done.push(el);
            else{
                cont.push(el);
            }
        });
        dizi = cont;
    }).then(() => {
        Category.findOne({},{ catName: 1, _id: 0}, (err, data) => {
            deger = data.get('catName');
        }).then( () => {
            res.render('job/is', { email: req.session.email,
                                  docs: dizi, category: deger });    
        });
    }).catch((err) => {
        console.log(err);
    });
});

router.get('/is', (req, res) => {
    Job.find({  }, (err, docs) => {
        dizi = docs;
    }).then(() => {
        Category.findOne({},{ catName: 1, _id: 0}, (err, data) => {
            deger = data.get('catName');
        }).then( () => {
            res.render('job/is', { email: req.session.email,
                                  docs: dizi, category: deger });    
        });
    }).catch((err) => {
        console.log(err);
    });
});

router.get('/is/filtre/', (req, res) => {
    if(!(!req.query.bud & !req.query.category)){
        budget = req.query.bud == '' ? 0 : Number(req.query.bud);
        if(req.query.category == ''){
            Job.find({ category: { $ne :req.query.category }, budget: { $gte: budget } }, (err, docs) => {
                dizi = docs;
            }).then(() => {
                Category.findOne({},{ catName: 1, _id: 0}, (err, data) => {
                    deger = data.get('catName');
                }).then( () => {
                    res.render('job/is', { email: req.session.email,
                                          docs: dizi, category: deger,
                                          filter: {
                                              budget, category: 'Kategori Belirtilmemiş'
                                          }});    
                });
            }).catch((err) => {
                console.log(err);
            });
        }
        else{
            Job.find({ category: req.query.category, budget: { $gte: budget } }, (err, docs) => {
                dizi = docs;
            }).then(() => {
                Category.findOne({},{ catName: 1, _id: 0}, (err, data) => {
                    deger = data.get('catName');
                }).then( () => {
                    res.render('job/is', { email: req.session.email,
                                          docs: dizi, category: deger,
                                          filter: {
                                              budget, category: req.query.category
                                          }});    
                });
            }).catch((err) => {
                console.log(err);
            });
        }
    }
    else{
        res.redirect('/job/is');
    }
});

router.get('/yukle', ensureAuthenticated, (req, res) => {
    Category.findOne({},{ catName: 1, _id: 0}, (err, data) => {
        deger = data.get('catName');
    }).then( () => {
        res.render('job/yukle', { email: req.session.email,
                                 category: { deger },
                                 proc: 'upload'
                                });
    });

});

router.get('/guncelle/:id', ensureAuthenticated, (req, res) => {
    let title = undefined,
        details = undefined,
        budget = undefined,
        lastDate = undefined;
    Category.findOne({},{ catName: 1, _id: 0}, (err, data) => {
        deger = data.get('catName');
    });
    Job.findById( { _id: req.params.id }, (err, data) => {
        title = data.title;
        details = data.details;
        budget = data.budget;
        lastDate = data.lastDate;
    }).then( () => {
        res.render('job/yukle', { email: req.session.email, category: { deger },
                                 title, info: details, budget, date: lastDate,
                                 proc: 'update', id: req.params.id
                                });    
    }).catch((err) => {
        console.log(err);
    });
});

router.get('/is/:title/:id', (req, res) => {
    Job.findById({ _id: req.params.id }, (err, data) => {
        deger = data;
    }).then( () => {
        res.render('job/job', { deger, email: req.session.email });    
    }).catch((err) => { console.log(err) });

});

router.get('/download/:id', ensureAuthenticated, (req, res) => {
    let filename = '';
    Job.findById( { _id: req.params.id }, (err, data) => {
        if(data.file){
            filename = data.file.fileName;
            fs.writeFileSync(data.file.fileName, data.file.fileData.buffer);
        }
    }).then(() => {
        res.download('./' + filename, (err) => {
            fs.unlink('./' + filename, (err) => {console.log(err)});
        });
    }).catch(() => {});
});
//Kullanıcıların yükledikleri işlerin sayfası
router.get('/islerim', ensureAuthenticated, (req, res) => {
    let nonOffer = [],//Teklif yapılmayan işler
        cont = [],//Devam eden veya ödemesi yapılmayan işler
        done = [],//Ödemesi yapılan işler
        expire = [];//Süresi dolan işler
    Job.find({ email: req.session.email }, (err, docs) => {
        docs.forEach((element) => {
            if(typeof element.offers == 'undefined'){
                nonOffer.push(element);
            }
            else if(typeof element.acceptedOffer != 'undefined'){
                if(element.acceptedOffer.case == "devam ediyor"){
                    cont.push(element);
                }
                else if(element.acceptedOffer.paid == 1){
                    done.push(element);
                }
            }
            else if(Date.now() < element.lastDate.getTime() && element.offers.length == 0){
                expire.push(element);
            }
        })
    }).then(() => {
        res.render('job/myJob', { email: req.session.email,
                                 docs: cont, nonOffer, done, expire});    
    }).catch((err) => {
        console.log(err);
    });
});

router.get('/accept/:id/:ofId', (req, res) => {
    mail = '';
    budget = '';
    maillist = [];
    Job.findById({ _id: req.params.id }, (err, data) => {
        for(var i=0;i<data.offers.length;i++){
            if(data.offers[i]._id == req.params.ofId){
                mail = data.offers[i].email;
                offer = data.offers[i].offer;
            }else{
                maillist.push(data.offers[i].email);
            }
        }
        var mailOptions = {
            from: '<freelanceprojesi@gmail.com',
            to: mail,
            subject: 'Teklif Sonucu',
            text: 'Sayın kullanıcımız yapmış olduğunuz iş başvurunuz kabul edilmiştir.' + 
            'Göreviniz profil sayfanızdaki Görevlerim bölümüne eklenmiştir.'
        };
        transporter.sendMail(mailOptions, function(err) {
        });
        maillist.forEach(function (to, i , array) {
            var mailOptions2 = {
                from: '<freelanceprojesi@gmail.com',
                subject: 'Teklif Sonucu', // Subject line
                text: 'Sayın kullanıcımız yapmış olduğunuz iş başvurunuz kabul edilmemiştir!!!' + 
                'Bir sonraki iş için başvurularınızı bekliyoruz.'
            }
            mailOptions2.to = to;
            transporter.sendMail(mailOptions2, function(err){
            });
        });

    }).then(() => {
        Job.findOneAndUpdate( { _id: req.params.id }, { acceptedOffer: { email: mail, offer, 
                                                                        case: 'devam ediyor',
                                                                        paid: 0}}).then(() => {
            res.redirect('/job/islerim');
        });
    }).catch((err) => {
        console.log(err);
    });
});

router.get('/isler', ensureAuthenticated, (req, res) => {
    Job.find({ "acceptedOffer.email" : req.session.email }, (err, data) => {
        res.render('job/myJobs', { email: req.session.email,
                                  data });
    });
});

router.get('/done/:id', ensureAuthenticated, (req, res) => {
    Job.findOneAndUpdate( { _id: req.params.id }, { "acceptedOffer.case": 'tamamlandı', "acceptedOffer.paid": 0}).then(() => {
        res.redirect('/job/isler');    
    }).catch(()=>{});
});

router.get('/send/:id', ensureAuthenticated, (req, res) => {
    Job.findOneAndUpdate( { _id: req.params.id }, { "acceptedOffer.case" : 'tamamlandı', "acceptedOffer.paid": 1}).then(() => {
        Job.findOne({ _id: req.params.id }, (err, data) => {
            var mailOptions = {
                from: '<freelanceprojesi@gmail.com',
                to: data.acceptedOffer.email,
                subject: 'Ödeme İşlemi',
                text: 'Sayın kullanıcımız tamamlamış olduğunuz ' + data.title + ' işinin ödemesi hesabınıza aktarılmıştır.'
            };
            transporter.sendMail(mailOptions, function(err) {
            });
        }).then(() => {
            res.redirect('/job/islerim');    
        }).catch(()=> {});
    });
});

router.get('/is/ara', (req, res) => {
    const filter = req.query.search;
    Job.find({ details: { $regex: filter, $options: 'i' }}, (err, docs) => {
        dizi = docs;
    }).then(() => {
        Category.findOne({},{ catName: 1, _id: 0}, (err, data) => {
            deger = data.get('catName');
        }).then( () => {
            res.render('job/is', { email: req.session.email,
                                  docs: dizi, category: deger, search: filter });    
        });
    }).catch((err) => {
        console.log(err);
    });
});

router.post('/upload', (req, res) => {
    if(req.files){
        var file = req.files.filename,
            filename = file.name;
        file.mv('./tmp/' + filename, (err) => {
            if(err){
                console.log(err);
                res.render('job/yukle', { proc: 'upload', email: req.session.email });
            }
            fileName = filename;
            Category.findOne({},{ catName: 1, _id: 0}, (err, data) => {
                deger = data.get('catName');
            }).then( () => {
                res.render('job/yukle', { email: req.session.email,
                                         category: { deger },
                                         proc: 'upload'
                                        });
            });
        });
    }else{
        res.redirect('/job/yukle');
    }
});

router.post('/yukle', ensureAuthenticated, (req, res) => {
    let errors = [];
    const { title, category, info, budget, date } = req.body;
    if(!category || !info || !budget || !date ){
        errors.push( { message: 'Lütfen boş alan bırakmayınız!' });
        Category.findOne({},{ catName: 1, _id: 0}, (err, data) => {
            deger = data.get('catName');
        }).then( () => {
            res.render('job/yukle', { email: req.session.email,
                                     title,
                                     category: { deger },
                                     info,
                                     budget,
                                     date,
                                     errors,
                                     proc: 'upload'
                                    });
        });
    }
    else{
        if(fileName != ''){
            var binaryFileData = fs.readFileSync(__dirname + '/../tmp/' + fileName);
            const newJob = new Job({
                email: req.session.email,
                username: req.session.name,
                title,
                category,
                details: info,
                budget,
                lastDate: date,
                file: {
                    fileName: fileName,
                    fileData: binaryFileData
                }
            });
            newJob.save().then(() => {
                fs.unlink(__dirname + '/../tmp/' + fileName, (err) => {});
                fileName = '';
                req.flash('success_msg', 'Göreviniz sisteme yüklenmiştir.');
                res.redirect('/job/yukle');
            }).catch((err) => {
                console.log(err);

            });
        }
        else{
            const newJob = new Job({
                email: req.session.email,
                username: req.session.name,
                title,
                category,
                details: info,
                budget,
                lastDate: date
            });
            newJob.save().then(() => {
                req.flash('success_msg', 'Göreviniz sisteme yüklenmiştir.');
                res.redirect('/job/yukle');
            }).catch((err) => {
                console.log(err);

            });
        }
    }
});

router.post('/guncelle/:id', ensureAuthenticated, (req, res) => {
    let errors = [];
    const { title, category, info, budget, date } = req.body;
    if(!category || !info || !budget || !date ){
        errors.push( { message: 'Lütfen boş alan bırakmayınız!' });
        Category.findOne({},{ catName: 1, _id: 0}, (err, data) => {
            deger = data.get('catName');
        }).then( () => {
            res.render('job/yukle', { email: req.session.email,
                                     title,
                                     category: { deger },
                                     info,
                                     budget,
                                     date,
                                     errors,
                                     proc: 'update',
                                     id: req.params.id
                                    });
        });
    }
    else{
        Job.findOneAndUpdate( { _id: req.params.id }, {
            title, category, details: info, budget, lastDate: date
        }).then( () => {
            res.redirect('/job/islerim');
        }).catch((err) => {
            console.log(err);
        });   
    }
});

router.post('/islerim/:id', ensureAuthenticated, (req, res) => {
    Job.findOneAndDelete({ _id: req.params.id }).then(() => {
        res.redirect('/job/islerim');
    });
})

router.post('/is/:title/:id', ensureAuthenticated, (req, res) => {
    const offer = req.body.offer;
    dizi = undefined;
    if(!offer){
        Job.findById({ _id: req.params.id }, (err, data) => {
            res.render('job/is', { deger: data, email: req.session.email });   
        });
    }
    else{
        Job.findById({ _id: req.params.id }, (err, data) => {
            if(data.email != req.session.email){
                dizi = data.offers;
                if(req.session.email.includes('edu.tr')){
                    User.findOne({ email: req.session.email }, (err, doc) => {
                        dizi.push( { email: req.session.email, username: doc.username, offer });
                    }).then(() => {
                        Job.findOneAndUpdate( { _id: req.params.id }, { offers: dizi}).
                        then(() => {
                            res.redirect('/job/is/' + req.params.title + '/' + req.params.id);
                        }).catch((err)=>{ console.log(err) });
                    });
                }
            }

        });
    }
});

router.post('/is/:id', ensureAuthenticated, (req, res) => {
    const comment = req.body.comment;
    let errors = [];
    let dizi= [];
    if(!comment){
        res.redirect('/job/is');
    }
    else{
        Job.findById({ _id: req.params.id }, (err, data) => {
            dizi = data.reply;
            title = data.title;
        }).then( () => {
            User.findOne({ email: req.session.email }, (err, doc) => {
                dizi.push( { email: req.session.email, username: doc.username, rep: comment });
            }).then(() => {
                Job.findOneAndUpdate( { _id: req.params.id }, { reply: dizi}).
                then(() => {
                    res.redirect('/job/is/' + title + '/' +req.params.id);
                }).catch((err)=>{ console.log(err) });
            }).catch(()=>{});
        }).catch(()=>{});
    }
});

router.post('/is/:username/:id', (req, res) => {
    console.log(req.params.username + req.params.id);
});

module.exports = router;