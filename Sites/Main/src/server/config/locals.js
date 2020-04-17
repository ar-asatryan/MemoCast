module.exports = function(app) {
    app.locals['page-title'] = 'Российские сериалы. Смотреть лучшие российские фильмы | Memocast';
    app.locals.initPageTitle = function(title) {
        if (!!title && title !== '') {
            return `${title} | Memocast`;
        } else {
            return app.locals['page-title'];
        }
    };
};
