const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const empSchema = new Schema({
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
    resetPasswordToken: {
        type: String,
        required: false
    },
    resetPasswordExpires: {
        type: Date,
        required: false
    },
    isVerified: { 
        type: Boolean, 
        default: false 
    },
    img: 
    { 
        type: {
            data: Buffer, 
            fileName: String 
        },
        required: false
    }
}, { collection: 'isveren', versionKey: false });

const Employer = mongoose.model('isveren', empSchema);

module.exports = Employer;