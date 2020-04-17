var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');

var exphbs  = require('express-handlebars');

var app = express();
var favIconPath = path.join(__dirname, '../client', 'favicon.ico');
app.use(favicon(favIconPath));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({ 
    secret: 'RdoQKAc9HyWpwMPJu7jEmdkg93FIf3BK',
    resave: false,
    saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, '../client/')));
app.use(express.static(path.join(__dirname, "../")));
app.use(express.static(path.join(__dirname, '../tmp')));

var ensureAuthenticated = function(req, res, next) {
    if (req.user) { return next(null); }
    res.redirect('/login')
};

// Initialize Passport and restore authentication state, if any, from the
// session.
require('./config/passport')(app);

// view engine
app.set('views', __dirname + '/views');
app.engine('handlebars', exphbs(
    {
        defaultLayout: 'main',
        layoutsDir: __dirname + '/views/layouts',
        partialsDir: __dirname + '/views/partials',
    }
));
app.set('view engine', 'handlebars');

// routes

var auth = require('./routes/auth');
var bootstrap = require('./routes/bootstrap');

app.get('/', function(req, res) {
    res.render('home');
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {
    res.redirect('/secured');
});

app.get('/login', function(req, res) {
    if (req.user) {
        res.redirect('/secured');
    } else {
        res.render('login');
    }
});

app.get('/secured',
    ensureAuthenticated, 
    function(req, res) {
        res.render('secured', { user: req.user }); 
    }
);

app.get('/logout',
    function(req, res){
        req.logout();
        res.redirect('/');
    }
);

app.use('/auth', auth);

app.use('/bootstrap', bootstrap);

app.get('/help', function(req, res) {
   
    res.render('help');
    
});

// handling errors
require('./routes/error')(app);

var port = 7886;

app.listen(port, function () {
  console.log('Memocast admin app listening on port ' + port.toString() + '!');
});