const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    university: {
        type: String,
        required: true
    },
    cv: {
        type: String,
        required: false
    },
    talent: {
        type: [{
            content: String
        }],
        required: false
    },
    resetPasswordToken: {
        type: String,
        required: false
    },
    resetPasswordExpires: {
        type: Date,
        required: false
    },
    point: {
        type: Number,
        required: false
    },
    isVerified: { 
        type: Boolean, 
        default: false 
    },
    userRating: {
        type: [{
            userMail: String,
            rate: Number
        }],
        required: false
    },
    img: 
    { 
        type: {
            data: Buffer, 
            fileName: String 
        },
        required: false
    }
},{ collection: 'ogrenci', versionKey: false });

const User = mongoose.model('ogrenci', UserSchema);

module.exports = User;