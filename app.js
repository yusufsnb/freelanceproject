if (process.env.NODE !== 'production') {
    require('dotenv').config();
}

//Modüller
const express = require('express');
const ejs = require('ejs');
const app = express();
const path = require('path');
const ejsLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const upload = require('express-fileupload');
//Veritabanı Bağlantı ve Modülleri
const mongoose = require('mongoose');
const db = require('./config/keys').MongoURI;
const model = require('./models/User');
mongoose.connect(db, {
    useNewUrlParser: true
});
const dbCon = mongoose.connection;
dbCon.on("error", console.log.bind(console, "Bağlantı hatası"));
dbCon.once("open", () => {
    console.log('Veritabanına bağlandı');
})


require('./config/passport-config')(passport);
//Express Oturum yönetimi
app.use(session({
    secret: 'max',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(upload());

app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

//Yönlendirmeler
app.set('view engine', 'ejs');
app.use('/assets', express.static(__dirname + '/assets'));
app.use(ejsLayouts);

const urlEncodedParser = bodyParser.urlencoded({
    extended: false
});
app.use(urlEncodedParser);


app.use('/', require('./routes/index'));
app.use('/user', require('./routes/user'));
app.use('/job', require('./routes/job'));
app.use('/employer', require('./routes/employer'));
app.use('/intern', require('./routes/intern'));
app.use((req, res) => {
    res.render('404', {
        titleName: 'Sayfa bulunamadı',
        email: req.session.email
    });
});

app.listen(process.env.PORT || 8080, () => {
    console.log('8080 nolu port dinleniyor.');
});



/*
Mesajlaşma  https://socket.io/docs/
Saatlik iş veya iş teklifi
Yıldız puanlama sistemi https://rateyo.fundoocode.ninja/#option-starWidth
Email doğrulama sistemi https://codemoto.io/coding/nodejs/email-verification-node-express-mongodb
Bildirim sistemi    https://pusher.com/tutorials/realtime-notifications-nodejs
                    https://codeforgeek.com/real-time-notification-system-using-socket-io/
Arkaplan adresi     https://images.pexels.com/photos/326240/pexels-photo-326240.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940
Maillerde tıklama olayı için a href koy.
*/