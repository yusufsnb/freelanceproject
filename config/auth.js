module.exports = {
    ensureAuthenticated: function(req, res, next) {
        if(req.isAuthenticated()){
            return next();
        }
        req.flash('error_msg', 'Bu sayfaya erişmek için giriş yapınız');
        res.redirect('/user/login');
    },
    ensureNotAuthenticated: function(req, res, next) {
        if(!req.isAuthenticated()){
            return next();
        }
        res.redirect('/user/profile');
    }
}