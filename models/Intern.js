const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const IntSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    mail: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    tur: {
        type: String,
        required: true
    },
    info: {
        type: String,
        required: true
    },
    linkedin: {
        type: String,
        required: false
    },
    intern_link: {
        type: String,
        required: false
    },
    upMail: {
        type: String,
        required: true
    },
    imkan: {
        type: {
            yol: String,
            yemek: String,
            yer: String,
            maas: String
        },
        required: false
    }
},{ collection: 'staj', versionKey: false });

const Intern = mongoose.model('staj', IntSchema);

module.exports = Intern;
