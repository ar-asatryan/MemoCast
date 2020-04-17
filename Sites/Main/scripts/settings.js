$(function () {
    var $settingsButton = $('#settings-button');
    var $settingsPopover = $('#settings-popover');

    $settingsButton.click(function () {
        if ($settingsPopover.is(':visible')) {
            $settingsPopover.hide();
        } else {
            $settingsPopover.show();
            var thet = new Tether({
                element: document.getElementById('settings-popover'),
                target: document.getElementById('settings-button'),
                attachment: 'top right',
                targetAttachment: 'bottom right'
            });
        }
    });

    $('#cb-settings-incognito').change(function () {
        var val = $(this).prop('checked');
        var data = { incognito : val };
        var url = '/api/user/incognito';
        $.ajax(url, {
            method: 'POST',
            data: data,
            success: function (response) {
                console.log(response);
            },
            error: function (err) {
                console.log(err);
            }
        })
    });

    $('#cb-legacy-playback').change(function () {
        var val = $(this).prop('checked');
        var url = '/link/legacyplayback/' + (val ? 'true' : 'false');
        window.location.assign(url);
    });
});
