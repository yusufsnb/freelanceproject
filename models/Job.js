const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jobSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    budget: {
        type: Number,
        required: true
    },
    lastDate: {
        type: Date,
        required: true
    },
    offers: {
        type: [{ 
            email: String,
            username: String,
            offer: Number
        }],
        required: false
    },
    file: {
        type: {
            fileName: String,
            fileData: String
        },
        required: false
    },
    reply: {
        type: [{
            email: String,
            username: String,
            rep: String
        }],
        required: false
    },
    acceptedOffer: {
        type: {
            email: String,
            budget: Number,
            case: String,
            paid: Number
        },
        required: false
    }
},{ collection: 'gorevler', versionKey: false });

const Job = mongoose.model('gorevler', jobSchema);

module.exports.Job = Job;

const catSchema = new Schema({
},{ collection: 'kategoriler', versionKey: false });

const Category = mongoose.model('kategoriler', catSchema);

module.exports.Category = Category;