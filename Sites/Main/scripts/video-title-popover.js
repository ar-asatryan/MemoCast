$(function() {

    var $popover = $('#mmc-video-title-popover');

    var overTimer = null;

    $('.mmc-video-popover').hover(function() {
        // mouse over
        var $item = $(this);
        var target = this;
        overTimer = setTimeout(function() {
            overTimer = null;

            var videoTitleID = $item.data('video-title-id');

            var url = '/api/video/titles/' + videoTitleID + '/history';
            $.ajax(url, {
                method: 'GET',
                success: function(response) {
                    var title = response.videoTitle.title;
                    Memocast.loadTemplateByName('popover-title', function (err, temp) {
                        $popover.html(temp(response));
                        $popover.show();
                        var thet = new Tether({
                            element: document.getElementById('mmc-video-title-popover'),
                            target: target,
                            attachment: 'top center',
                            targetAttachment: 'bottom center'
                        });
                    });
                }
            });

        }, 500);
    }, function() {
        // mouse out
        if (overTimer) {
            clearTimeout(overTimer);
            overTimer = null;
        } else {
            $popover.hide();
        }
    });

});
