const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const uniSchema = new Schema({
},{ collection: 'universite', versionKey: false });

const University = mongoose.model('universite', uniSchema);

module.exports = University;