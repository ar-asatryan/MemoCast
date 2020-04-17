Handlebars.registerHelper('equal', function(lvalue, rvalue, options) {
    if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
    if( lvalue!=rvalue ) {
        return options.inverse(this);
    } else {
        return options.fn(this);
    }
});

Handlebars.registerHelper('istring', function (options) {
    var locale = Memocast.locale;
    if (options) {
        var optVal = options.hash[locale];
        if (optVal) { return optVal; }
    }
    return '';
});

Handlebars.registerHelper('render-text', function (source, options) {
    var output = source;

    /// TODO: process line breaks and links to videos

    return output;
})

Handlebars.registerHelper('category', function (category, options) {
    var locale = Memocast.locale;
    if (locale == 'ru') {
        switch (category)
        {
            case "Dom Kino Collection":
                return "Дом Кино";
            case "Action/Adventure":
                return "Экшн/Приключения";
            case "Anime":
                return "Анимэ";
            case "Comedy":
                return "Комедии";
            case "Opera / Ballet":
                return "Опера / Балет";
            case "Tutorials":
                return "Обучающие видео";
            case "Short Films":
                return "Короткометражные";
            case "Social Initiatives":
                return "Социальные иннициативы";
            case "Cartoons":
                return "Мультфильмы";
            case "Classics":
                return "Классика";
            case "Crime/Gangster":
                return "Криминал";
            case "Detective":
                return "Детектив";
            case "Documentary":
                return "Документальные";
            case "Drama":
                return "Драма";
            case "Education":
                return "Образовательные";
            case "Experimental Art":
                return "Экспериментальное искуство";
            case "Fashion Week":
                return "Мода";
            case "Favorites":
                return "Избранное";
            case "Historical/Epics":
                return "Исторические";
            case "Holiday Collection FREE":
                return "Праздничная коллекция";
            case "Humor":
                return "Юмор";
            case "Kids/Family":
                return "Детские";
            case "Musicals / Music":
                return "Музыкальные";
            case "New releases":
                return "Новинки";
            case "Public Service Advertisement / Commercials":
                return "Реклама";
            case "Religion":
                return "Религия";
            case "Romance":
                return "Романтика";
            case "Science Fiction / Fantasy":
                return "Фантастика";
            case "Sports / Fitness":
                return "Спорт / Фитнес";
            case "Television":
                return "ТВ";
            case "Theatre":
                return "Театр";
            case "Thriller":
                return "Триллер";
            case "TV News":
                return "Новости";
            case "TV Shows (Serials)":
                return "ТВ/Сериалы";
            case "War":
                return "Военные";
            case "Western":
                return "Вестерн";
            case "Acoustic":
                return "Акустика";
            case "Bard":
                return "Барды";
            case "Blues":
                return "Блюз";
            case "Christian":
                return "Христианские песни";
            case "Christian rap":
                return "Христианский рэп";
            case "Concerts":
                return "Концерты";
            case "Country":
                return "Кантри";
            case "Electronic / Dance":
                return "Электро / Танцевальная";
            case "Folk":
                return "Народная";
            case "Funk":
                return "Фанк";
            case "Hip Hop":
                return "Хип Хоп";
            case "Jazz":
                return "Джаз";
            case "Karaoke":
                return "Караоке";
            case "Latin":
                return "Латина";
            case "New Age":
                return "Нью Эйдж";
            case "Pop":
                return "Поп";
            case "R&B":
                return "Ритм'н'Блюз";
            case "Rap":
                return "Рэп";
            case "Reggae":
                return "Рэгги";
            case "Rock":
                return "Рок";
            case "Soul":
                return "Соул";
            case "Tango":
                return "Танго";
            case "Music Videos":
                return "Музыка";
            case "Movies":
                return "Фильмы";
            case "All Videos":
                return "Все";
            case "Free Collection":
                return "Бесплатная коллекция";
            case "Turkish Serials":
                return "Турецкие сериалы";
            case "Cooking":
                return "Кулинария";
            case "Horror":
                return "Ужасы";
            case "Politics":
                return "Политика";
            default:
                return category;
        }
    } else {
        return category;
    }
});

var commentsTemplate = null;
var playerTemplate = null;
var popoverTitleTemplate = null;
var personTemplate = null;
var videoTitleTemplate = null;
var feedItemTemplate = null;
var videoRequestTemplate = null;



$(function() {

    Memocast.templates = { };

    Memocast.loadTemplateByName = function (templateName, callback) {
        if (Memocast.templates[templateName]) {
            return callback(null, Memocast.templates[templateName]);
        } else {
            var url = '/templates/' + templateName;
            $.ajax(url, {
                method: 'GET',
                success: function (response) {
                    var template = Handlebars.compile(response);
                    Memocast.templates[templateName] = template;
                    callback(null, template);
                },
                error: function (err) {
                    callback(err, null);
                }
            });
        }
    };
});
