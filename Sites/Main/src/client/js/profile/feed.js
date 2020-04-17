$(function () {
    var apiURL = '/api/feed';

    var $win = $(window);
    var $feed = $('#feed');
    var $loading = $('#util-loading');
    // current ajax request
    var request = null;

    // Each time the user scrolls
    $win.scroll(function() {
        return;
        // End of the document reached?
        if ($(document).height() - $win.height() == $win.scrollTop()) {
            $loading.show();

            var itemsCount = $feed.find('.mmc-feed-item').length;

            if (request) { request.abort(); }
            var params = { skip: itemsCount };

            request = $.ajax(apiURL, {
                method: 'GET',
                data: params,
                success: function(response) {
                    var html = '';
                    Memocast.loadTemplateByName('feed-item', function (err, temp) {
                        response.forEach(function (item) {
                            html += temp(item);
                        });
                        $feed.append(html);
                        $loading.hide();
                    });
                },
                complete: function () {
                    request = false;
                }
            });
        }
    });
});
