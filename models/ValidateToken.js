const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tokenSchema = new mongoose.Schema({
    _userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Employer' },
    token: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now, expires: 43200 }
},{ collection: 'dogrulama', versionKey: false });


const ValToken = mongoose.model('dogrulama', tokenSchema);

module.exports = ValToken;