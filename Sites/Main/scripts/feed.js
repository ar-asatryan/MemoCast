$(function() {
    var $auto = $('#mmc-feed-popup');

    $('#bt-feed-popup').on('click', function (evt) {

        $(this).removeClass('mmc-has-updates');

        var visible = $auto.is(':visible');

        if (visible) {
            $auto.hide();
        } else {
            var url = '/api/feed';
            var data = { limit : 5 };
            $.ajax(url, {
                method: 'GET',
                data: data,
                success: function (response) {
                    console.log(response);
                    Memocast.loadTemplateByName('feed-popup', function (err, template) {
                        var html = template(response);
                        $auto.html(html);
                        $auto.show();
                        var thet = new Tether({
                            element: document.getElementById('mmc-feed-popup'),
                            target: document.getElementById('bt-feed-popup'),
                            attachment: 'top right',
                            targetAttachment: 'bottom right'
                        });
                    });
                },
                error: function (err) {
                    console.log(err);
                }
            })
        } // if (visible) ... else ...

    });
});
