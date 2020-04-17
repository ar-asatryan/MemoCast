let exshbs = require('express-handlebars');
let categoryTranslate = require('../categories');

let data = {
    default: 'en',
    locales: { }
};

module.exports = {
    localeString: function (locale, options) {
        if (options) {
            let optVal = options[locale];
            if (optVal) { return optVal; }
        }
        return '';
    },
    loadLocale: function (lang, langData) {
        data.locales[lang] = langData;
    },
    setDefaultLocale: function (lang) {
        data.default = lang.toLowerCase();
    },
    'handlebars-helper': function (locale, prop, options) {
        if (options) {
            let optVal = options.hash[locale];
            if (optVal) { return optVal; }
        }
        let val = localeValue(locale, prop);
        if ((val === '' || !val) && options.hash.default) { val = options.hash.default; }
        return val;
    },
    'handlebars-helper-istring': function(locale, options) {
        if (options) {
            let optVal = options.hash[locale];
            if (optVal) { return optVal; }
        }
        return '';
    },
    'handlebars-helper-category': function (locale, category) {
        if (locale == 'ru') {
            return categoryTranslate(category);
        } else {
            return category;
        }
    },
    'language-detector': function (req, res, next) {
        let locale = (
            localeFromValue(req.cookies['Accept-Language'] || '')
            ||
            localeFromValue(req.get('Accept-Language') || '')
            ) || data.default;
        req.locale = locale;
        res.locals.locale = locale;
        next();
    },
    'update-languge': function (req, res) {
        let locale = req.params['locale'];
        res.cookie('Accept-Language', locale, { maxAge: 1000 * 60 * 60 * 24 * 365 });
        res.redirect('/');
    }
}

function localeFromValue(val) {
    let language = val;
    language = splitString(language, ';');
    let languages = language.split(',');
    for (let i = 0; i < languages.length; i++) {
        let language = languages[i];
        for (let prop in data.locales) {
            if (prop === language) {
                return language;
            }
        }
    }
    return null;
}

function localeValue(locale, property) {
    let obj = data.locales[locale];
    let prop = property;
    while (prop.indexOf('.') > 0) {
        let ind = prop.indexOf('.');
        obj = obj[prop.slice(0, ind)];
        if (!obj) { return ''; }
        prop = prop.substring(ind + 1);
    }
    return obj[prop] || '' ;
}

function splitString(s, d) {
    let str = s;
    const ind = str.indexOf(d);
    if (ind >= 0) { str = str.slice(0, ind); }
    return str;
}
