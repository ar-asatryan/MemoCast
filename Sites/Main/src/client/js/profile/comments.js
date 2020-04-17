$(function() {

    var request = null;
    var $comments = $('#div-comments');
    var $win = $(window);
    var $loading = $('#util-loading');

    var loadVideoComments = function() {

        $loading.show();

        if (request) { request.abort(); }
        var itemsCount = $comments.find('.mmc-video-comment').length;
        var params = { skip: itemsCount };

        var url = '/api/comment/my';

        request = $.ajax(url, {
            method: 'GET',
            data: params,
            success: function(response) {
                Memocast.loadTemplateByName('comments', function (err, temp) {
                    $comments.append(temp(response));
                    $loading.hide();
                });
            },
            complete: function () {
                request = false;
            }
        })
    };

    // Each time the user scrolls
    $win.scroll(function() {
        // End of the document reached?
        if ($(document).height() - $win.height() == $win.scrollTop()) {

            $loading.show();

            loadVideoComments();

        }
    });

   loadVideoComments();

});
