const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const talSchema = new Schema({
},{ collection: 'yetenekler', versionKey: false });

const Talent = mongoose.model('yetenekler', uniSchema);

module.exports = Talent;