const express = require('express');
const router = express.Router();
const Intern = require('../models/Intern');
const { ensureAuthenticated, ensureNotAuthenticated } = require('../config/auth');

router.get('/staj', (req, res) => {
    Intern.find({}, (err, data) => {
        dizi = data;
    }).then(() => {
        res.render('intern/intern', { email: req.session.email,
                                     docs: dizi});    
    }).catch((err) => {
        console.log(err);
    });
});

router.get('/yukle', ensureAuthenticated, (req,res) => {
    res.render('intern/upIntern', { email: req.session.email });
});

router.get('/stajlarim', ensureAuthenticated, (req,res) => {
    Intern.find({ upMail: req.session.email }, (err, data) => {
        res.render('intern/myInt', { docs: data, email: req.session.email } );
    });
});

router.get('/stajlarim/delete/:id', (req, res) => {
    Intern.findOneAndDelete({ _id: req.params.id }).then(() => {
        res.redirect('/intern/stajlarim');
    });
});

router.get('/staj/filtre', (req, res) => {
    if(req.query.tur == ''){
        if(req.query.yol == "on")
            Intern.find({ tur: { $ne: req.query.tur }, "imkan.yol": req.query.yol  }, (err, data) => {
                dizi = data;
            }).then(() => {
                res.render('intern/intern', { email: req.session.email,
                                             docs: dizi});    
            }).catch((err) => {
                console.log(err);
            });
        else if(req.query.maas == "on"){
            Intern.find({ tur: { $ne: req.query.tur }, "imkan.maas": req.query.maas  }, (err, data) => {
                dizi = data;
            }).then(() => {
                res.render('intern/intern', { email: req.session.email,
                                             docs: dizi});    
            }).catch((err) => {
                console.log(err);
            });
        }
        else if(req.query.yol == "on" && req.query.maas == "on"){
            Intern.find({ tur: { $ne: req.query.tur }, "imkan.yol": req.query.yol, "imkan.maas": req.query.maas  }, (err, data) => {
                dizi = data;
            }).then(() => {
                res.render('intern/intern', { email: req.session.email,
                                             docs: dizi});    
            }).catch((err) => {
                console.log(err);
            });
        }else{
            Intern.find({ tur: { $ne: req.query.tur }}, (err, data) => {
                dizi = data;
            }).then(() => {
                res.render('intern/intern', { email: req.session.email,
                                             docs: dizi});    
            }).catch((err) => {
                console.log(err);
            });
        }
    }
    else{
        if(req.query.yol == "on")
            Intern.find({ tur: req.query.tur, "imkan.yol": req.query.yol  }, (err, data) => {
                dizi = data;
            }).then(() => {
                res.render('intern/intern', { email: req.session.email,
                                             docs: dizi});    
            }).catch((err) => {
                console.log(err);
            });
        else if(req.query.maas == "on"){
            Intern.find({ tur: req.query.tur, "imkan.maas": req.query.maas  }, (err, data) => {
                dizi = data;
            }).then(() => {
                res.render('intern/intern', { email: req.session.email,
                                             docs: dizi});    
            }).catch((err) => {
                console.log(err);
            });
        }
        else if(req.query.yol == "on" && req.query.maas == "on"){
            Intern.find({ tur: req.query.tur, "imkan.yol": req.query.yol, "imkan.maas": req.query.maas  }, (err, data) => {
                dizi = data;
            }).then(() => {
                res.render('intern/intern', { email: req.session.email,
                                             docs: dizi});    
            }).catch((err) => {
                console.log(err);
            });
        }else{
            Intern.find({ tur: req.query.tur}, (err, data) => {
                dizi = data;
            }).then(() => {
                res.render('intern/intern', { email: req.session.email,
                                             docs: dizi});    
            }).catch((err) => {
                console.log(err);
            });
        }
    }

});

router.get('/staj/ara', (req, res) => {
    const filter = req.query.search;
    Intern.find({ info: { $regex: filter, $options: 'i' }}, (err, data) => {
        dizi = data;
    }).then(() => {
        res.render('intern/intern', { email: req.session.email,
                                     docs: dizi, search: filter});    
    }).catch((err) => {
        console.log(err);
    });
});

router.get('/staj/:comp', (req, res) => {
    Intern.findOne({ name: req.params.comp }, (err, data) => {
        res.render('intern/int', { docs: data, email: req.session.email });
    });
});


router.post('/yukle', ensureAuthenticated, (req, res) => {
    let errors = [];
    const { compName, mail, city, tur, info, linkedin, intern_link} = req.body
    yol = typeof req.body.yol != 'undefined' ? req.body.yol : 'off';
    yemek = typeof req.body.yemek != 'undefined' ? req.body.yemek : 'off';
    yer = typeof req.body.yer != 'undefined' ? req.body.yer : 'off';
    maas = typeof req.body.maas != 'undefined' ? req.body.maas : 'off';
    if(!compName || !city || !tur || !info ){
        errors.push({ message: 'Lütfen boş alan bırakmayınız!'});
        res.render('intern/upIntern', { email: req.session.email,
                                       compName,
                                       mail,
                                       city,
                                       info,
                                       linkedin,
                                       intern_link,
                                       errors
                                      });
    }
    else{
        const newIntern = new Intern({
            name: compName, mail, city, tur, info, linkedin, intern_link, upMail: req.session.email, imkan: {
                yol, yemek, yer, maas
            }});
        newIntern.save().then(() => {
            req.flash('success_msg', 'Stajınız sisteme yüklenmiştir.');
            res.redirect('/intern/yukle');
        }).catch((err) => {
            console.log(err);
        })
    }
});

module.exports = router;