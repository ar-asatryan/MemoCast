var Memocast = { };

// expecting jquery form object
Memocast.formDataToJson = function ($form) {
    var data = { };
    $form.serializeArray().forEach(function (item) {
        data[item.name] = item.value;
    });
    return data;
};

Memocast.ensureLogin = function (callback) {
    if (Memocast.CurrentUserID) {
        callback();
    } else {
        $.growl({
            delayOnHover: true,
            duration: 5000,
            location: 'tr',
            style: 'notice',
            url: '/login',
            title: '',
            message: $('#util-signup-message').html()
        });
    }
}

$(function () {
    // enable tooltips
    $('[data-toggle="tooltip"]').tooltip();

    // .mmc-video-item click
    $(document).on('click', '.mmc-video-item', function (evt) {
        evt.preventDefault();
        var $item = $(this);
        var url = $item.data('mmc-link');
        window.location.assign(url);
    });

    // handle add new time stamp
    var handleTimeStamp = function (index, item) {
        var $item = $(item);
        var str = $item.data('date');
        var m = moment(str);
        if (m.isValid()) {
            $item.text(m.fromNow());
        }
    };

    $('.mmc-time-stamp').each(handleTimeStamp);

    // moment.locale = Memocast.locale;
    $(document).on('DOMNodeInserted', function(e) {
        if ( $(e.target).hasClass('mmc-time-stamp-container') ) {
            $(e.target).find('.mmc-time-stamp').each(handleTimeStamp);
        }
    });

    // handle click outside .mmc-popover-content
    $(document).on('click', function (evt) {

        if (evt.target) {
            var $el = $(evt.target);
            console.log($el);
            if (!$el.hasClass('mmc-popover-triggerer') && $el.parents('.mmc-popover-triggerer').length == 0) {
                if ($el.parents('.mmc-popover-content').length == 0) {
                    $('.mmc-popover-content').hide();
                }
            }
        }
    });
});

// display dates
Memocast.applyDateToElements = function(items) {
    items.each(function (index, item) {
        console.log(item);
    });
}

var getStorageValue = function (name, defaultValue) {
    if (typeof(Storage) !== "undefined") {
        var tmp = localStorage[name];
        if (tmp) {
            return tmp;
        }
    }
    return defaultValue;
}

var setStorageValue = function (name, value) {
    if (typeof(Storage) !== "undefined") {
        localStorage[name] = value;
    }
}

$(function () {
    $('#bt-activate-welcome-back').on('click', function (evt) {
        evt.stopPropagation();
        var url = '/api/user/activate-welcome-back-subscription'
        $.ajax(url, {
            method: 'POST',
            data: {},
            success: function (response) {
                window.location.assign('/profile/subscription');
            },
            error: function (error) {
                console.log(error);
            }
        });
    });
});
