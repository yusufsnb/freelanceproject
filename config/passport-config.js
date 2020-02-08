const localStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Employer = require('../models/Employer');
email = undefined;
module.exports = function(passport){

    passport.use(new localStrategy({ usernameField: 'email'}, (email, password, done) => {
        this.email = email;
        boolMail = (email.match(/edu.tr/) === null ? false : true);
        if(boolMail){
            User.findOne({ email: email })
                .then(user => {
                if(!user) {
                    return done(null, false, {message: 'Bu isimde bir email yok!'});
                }
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if(err) throw err;

                    if(isMatch){
                        if(user.isVerified == false){
                            return done(null, false, { message: 'Hesabınız doğrulanmamıştır' });
                        }
                        return done(null, user);
                    }
                    else{
                        return done(null, false, { message: 'Hatalı şifre!' });
                    }
                })
            })
        }
        else{
            Employer.findOne({ email: email })
                .then(user => {
                if(!user) {
                    return done(null, false, {message: 'Bu isimde bir email yok!'});
                }
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if(err) throw err;

                    if(isMatch){
                        if(user.isVerified == false){
                            return done(null, false, { message: 'Hesabınız doğrulanmamıştır' });
                        }
                        return done(null, user);
                    }
                    else{
                        return done(null, false, { message: 'Hatalı şifre!' });
                    }
                })
            })
        }

    }));
    passport.serializeUser((user, done)=> done(null, user.id));
    passport.deserializeUser((id, done)=>{
        if(this.email.includes('edu.tr')){
            User.findById(id, (err, user) => {
                done(err, user);
            });
        }
        else{
            Employer.findById(id, (err, user) => {
                done(err, user);
            });
        }
    });
}