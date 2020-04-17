require('./module-path')();
let settings = require('./config/settings');

let express = require('express');
let exphbs  = require('express-handlebars');
let app = express();
let responseTime = require('response-time');
let http = require('http');
let path = require('path');

const validator = require('validator');

let favicon = require('serve-favicon');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');

const middlewares = require('./middlewares');

// set up session with redis
let session = require('express-session');
let redis = require('redis');
let redisClient = redis.createClient({ url: settings['redis-url'] });
let cache = require('./config/cache');
redisClient.on('connect', function () {
    cache.client = redisClient;
});
redisClient.on('error', function (err) {
    cache.client = null;
});
redisClient.on('end', function () {
    cache.client = null;
});
let RedisStore = require('connect-redis')(session);


// set up passport authentication
let passport = require('passport');

// set up rabbit mq
let rabbit = require('./config/rabbit');

// presentation util: helps translate storage data (videos, users, comments, etc)
// to presentation formam
let presentation = require('./config/presentation');

// connect to database
let models = require('./config/models');

// configure locals
require('./config/locals')(app);
app.use(function(req, res, next) {
    res.locals.initPageTitle = app.locals.initPageTitle;
    let d = new Date();
    res.locals.copyright = '&copy; Memocast Inc., 2005 - ' + d.getFullYear();
    next();
});

// middleware for flash messages
let flash = require('connect-flash');

// use response-time middleware
app.use(responseTime());

// using compression
if (settings.compression) {
    let compression = require('compression');
    app.use(compression(settings.compression));
}

// favicon
let favIconPath = path.join(__dirname, '../client', 'favicon.ico');
app.use(favicon(favIconPath));

app.use('/dist/', express.static(path.join(__dirname, '../../dist/')));
app.use('/sbadmin/', express.static(path.join(__dirname, '../../sbadmin')));
// app.use('/templates/', express.static(path.join(__dirname, '../../templates/')));
app.use('/bower/', express.static(path.join(__dirname, '../../bower_components/')));
app.use('/material/', express.static(path.join(__dirname, '../../material/')));
app.use(express.static(path.join(__dirname, '../client/')));

// cookies, body-parser, session
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(flash());
app.use(session({
    secret: 'RdoQKAc9HyWpwMPJu7jEmdkg93FIf3BK',
    cookie: { maxAge : 1000 * 60 * 60 * 24 * 30 }, // 30 days
    resave: false,
    saveUninitialized: false,
    store: new RedisStore({
        client: redisClient
    })
}));

// localization
let localize = require('./config/localization/localization.js');
localize.loadLocale('en', require('./config/localization/en.json'));
localize.loadLocale('ru', require('./config/localization/ru.json'));
localize.setDefaultLocale('ru');
app.use(localize['language-detector']);

let ensureAuthenticated = function(req, res, next) {
    if (req.user) { return next(null); }
    res.redirect('/login')
};

// DETECT IP (from IP adress and x-forwarded-for header)
app.use((req, res, next) => {
  req.realIp = req.query['mmc-ip'] || req.headers['x-forwarded-for'] || req.ip;
  next();
})

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
        helpers: {
            section: function(name, options) {
                if(!this._sections) this._sections = {};
                this._sections[name] = options.fn(this);
                return null;
            },
            'equal': function(lvalue, rvalue, options) {
                if (arguments.length < 3)
                    throw new Error("Handlebars Helper equal needs 2 parameters");
                if (lvalue && rvalue) {
                    if (lvalue.toString() == rvalue.toString()) {
                        return options.fn(this);
                    } else {
                        return options.inverse(this);
                    }
                } else {
                    return options.inverse(this);
                }
                if( lvalue!=rvalue ) {
                    return options.inverse(this);
                } else {
                    return options.fn(this);
                }
            },
            'string': localize['handlebars-helper'],
            'istring': localize['handlebars-helper-istring'],
            'category': localize['handlebars-helper-category'],
            'videos': function (videos, options) {
                let html = '';
                if (videos) {
                    for (let i = 1; i <= videos.length; i++) {
                        if (i % 3 == 1 && i <= videos.length) {
                            html += '\n<div class="row"><!-- begin : row -->\n';
                        }
                        html += options.fn(videos[i-1]);
                        if ((i % 3 == 0 && i > 1) || i == videos.length) {
                            html += '\n</div><!-- end : row -->\n';
                        }
                    }
                }
                return html;
            }, // 'videos' ...
            'users': function (users, options) {
                let html = '';
                if (users) {
                    for (let i = 1; i <= users.length; i++) {
                        if (i % 4 == 1 && i < users.length) {
                            html += '\n<div class="row">\n';
                        }
                        html += options.fn(users[i-1]);
                        if ((i % 4 == 0 && i > 1) || i == users.length) {
                            html += '\n</div><!-- row -->\n';
                        }
                    }
                }
                return html;
            }, // 'users' ...
            'render-text': function (source, options) {
                let output = source;

                /// TODO: process line breaks and links to videos

                return output;
            }
        } // helpers: ...
    }
));

app.set('view engine', 'handlebars');
app.set('debug', settings.debug);

// detect country by ip middleware and block certains countries (Ukraine)
app.use(middlewares.detectLocationByIp);
app.use(middlewares.countryBlock);

// app.use(express.static(path.join(__dirname, "../")));
// app.use(express.static(path.join(__dirname, "../../")));
// app.use(express.static(path.join(__dirname, '../tmp')));

// memocast-secret auth
app.use(function(req, res, next) {
    if (req.user) {
        return next();
    }

    let User = models.User;

    let secret = req.get('memocast-secret');
    if (secret && secret != '') {
        User.findOne({ 'secret-credentials.secret': secret }, function(err, item) {
            if (item) {
                req.user = item;
            }
            return next();
        });
    } else {
        return next();
    }
});

// roku auth token auth
app.use(function(req, res, next) {
    if (req.user) {
        return next();
    }

    let secret = req.get('roku-auth-token');
    if (secret) {
        let query = { token : secret };
        models.RokuDevice.findOne({ token : secret })
            .populate('user')
            .exec(function (err, item) {
                if (item) {
                    if (item.user) {
                        req.user = item.user;
                    }
                    return next();
                } else {
                    return res.send( { Error : 'Invalid token' } );
                }

            });
    } else {
        return next();
    }
});

// legacy playback
app.use((req, res, next) => {
    let legacyPlayback = false;
    let cookie = req.cookies['legacy-playback'];
    if (cookie && cookie === 'true') {
        legacyPlayback = true;
    }
    res.locals.legacyPlayback = legacyPlayback;
    next();
});

app.use(function(req, res, next) {

    res.locals.debug = settings.debug;
    next();

});

// is admin detection
app.use(function(req, res, next) {
    let userIsAdmin = false;

    let user = req.user;

    if (user) {
        if (user.roles) {
            if (user.roles.length > 0) {
                for (let i = 0; i < user.roles.length; i++) {
                    let role = user.roles[i];
                    if (role === 'admin') {
                        userIsAdmin = true;
                        break;
                    }
                }
            }
        }
    }

    req.userIsAdmin = userIsAdmin;
    res.locals.userIsAdmin = userIsAdmin;

    next();
});

// subscription detection
app.use(function (req, res, next) {

    let activeSubscription = false;
    let activeSubscriptionCanUpgradeCreditCard = false;
    let activeSubscriptionIsTemporary = false;

    let user = req.user;

    if (user) {
        if (user.subs) {
            if (user.subs.length > 0) {
                let today = new Date();
                for (let i = 0; i < user.subs.length; i++) {
                    let sub = user.subs[i];
                    if (sub.active) {

                        let ok = false;

                        if (sub.expire && sub.expire >= today) {
                            ok = true;
                        } else if (!sub.expire) {
                            ok = true;
                        }

                        if (!ok) { continue };

                        // checking if subscription is cybersource recurring
                        if (sub.cybersource && sub.kind == 'recurring') {
                            activeSubscriptionCanUpgradeCreditCard = true;
                        }

                        const { notes } = sub;
                        activeSubscriptionIsTemporary = notes === 'Temporary Subscription';

                        activeSubscription = sub;

                    }
                } // for (let i = 0; i < user.subs.length; i++) { ...
            } // if (user.subs.length > 0) ...
        } // if (user.subs) { ...
    } // if (user) { ...

    req.activeSubscription = activeSubscription;
    res.locals.activeSubscription = activeSubscription;

    req.activeSubscriptionCanUpgradeCreditCard = activeSubscriptionCanUpgradeCreditCard;
    res.locals.activeSubscriptionCanUpgradeCreditCard = activeSubscriptionCanUpgradeCreditCard;

    req.activeSubscriptionIsTemporary = activeSubscriptionIsTemporary;
    res.locals.activeSubscriptionIsTemporary = activeSubscriptionIsTemporary;

    next();

});

app.use(function(req, res, next) {

    if (req.user) {
        let usr = presentation.User(req.user);
        res.locals['user'] = usr;
    }

    return next();

});

// check for 'welcome-back' availability
app.use((req, res, next) => {
    if (!!req.user && !req.activeSubscription) {
        const { email } = req.user;
        if (!!email && validator.isEmail(email)) {
            models.WelcomeBackEmail.findOne({
                email: email.toLowerCase(),
                activated: false,
            }).exec((err, item) => {
                if (!err && !!item) {
                    req['welcome-back'] = item;
                    res.locals['welcomeBack'] = item;
                }
                return next();
            });
        } else {
            return next();
        }
    } else {
        return next();
    }
});

app.use(function(req, res, next) {
    res.locals['socketio'] = settings['socket-io-server'];
    next();
});

// home page
app.get('/', require('./routes/home'));

// helper pages (help, about, feedback, contacts)
require('./routes/helpers/helpers')(app);

// set up auth pages (login, signup, password recovery)
require('./routes/auth/auth')(app);

// people page (browse, user's pages)
app.use('/people', require('./routes/people')());

// profile & subscription pages
app.use('/profile', require('./routes/profile')());

// search videos
app.use('/search', require('./routes/search')());

// queue(s)
app.use('/queue', require('./routes/queue')());

// videos
app.use('/video', require('./routes/video')());

// videos lists (top, categories, )
app.use('/videos', require('./routes/videos')());

// secured page (for tests)
app.use('/secured', require('./routes/secured')());

// categories pages
app.use('/category', require('./routes/category')());

// admin pages
app.use('/admin', require('./routes/admin/admin')(app));

// public api
app.use('/api', require('./routes/api')(app));

// public api
app.use('/link', require('./routes/helpers/link')(app));

// images
app.use('/images', require('./routes/images')(app));

// tests
app.use('/test', require('./routes/helpers/test')());

// templates
app.use('/templates', require('./routes/templates')());

// roku
app.use('/roku', require('./routes/roku')());

// ip
app.get('/ip', require('./routes/ip'));

// bootstrap tests
app.get('/booty', function(req, res) {
    res.render('bootstrap', { layout: null });
});

// comments
require('./routes/comment')(app);

app.get('/media', function(req, res) {

    res.send('<h1>Media Page</h1>');

});

// handle 301 redirects
require('./config/301')(app);

// handling errors
require('./routes/error')(app);

// 404 error
app.use((req, res, next) => {
    res.status(404).render('helpers/404');
});

// app.use(function(req, res, next) {
//   res.redirect('/');
// });

let port = settings.port;

let server = http.createServer(app);
let io = require('./config/io');
io.connect(server);

server.listen(port, function () {
  console.log('Memocast app listening on port ' + port.toString() + '!');
});
