$(function () {
    var apiURL = VideosAPIURL;

    var $win = $(window);
    var $videos = $('#videos');
    var $form = $('#form-videos-filter');
    var $title = $('#tb-videos-filter-title');
    var $videosContent = $videos.find('.row');
    var $loading = $('#util-loading');
    // current ajax request
    var request = null;

    var $years = $('#video-years');

    // Each time the user scrolls
    $win.scroll(function() {

        return;

        if (apiURL == '') {
            return;
        }

        // End of the document reached?
        if ($(document).height() - $win.height() == $win.scrollTop()) {
            fetchVideos();
        }
    });

    // handle $years option change
    $years.change(function (evt) {
        clearVideos();
        fetchVideos();
        // var year = $years.val();
        // var url = VideosPageURL + '?year=' + year;
        // window.location.assign(url);
    });

    // prevent form from submitting
    $form.on('submit', function(evt) {
        event.preventDefault();
    });

    // handle $title change
    var lastValue = $.trim($title.val());
    var titleUpdateTimer = null;
    var titleUpdateTimerDuration = 500; // ms
    $title.on('input', function (evt) {
        var currentValue = $.trim(this.value);
        if (currentValue != lastValue) {

            if (titleUpdateTimer) {
                window.clearTimeout(titleUpdateTimer);
                titleUpdateTimer = null;
            }

            titleUpdateTimer = window.setTimeout(function () {

                titleUpdateTimer = null;

                lastValue = currentValue;
                clearVideos();
                fetchVideos();

            }, titleUpdateTimerDuration);

        }
    });

    var clearVideos = function () {
        $videosContent.html('');
    };

    var fetchVideos = function() {

        if (apiURL == '') {
            return;
        }

        $loading.show();
        var itemsCount = $videos.find('.mmc-video-item').length;

        if (request) { request.abort(); }

        var params = VideosFilterParams;
        params.year = $years.val();
        params.year = params.year == '' ? null : parseInt(params.year);
        params.title = $.trim($title.val());
        params.skip = 0;
        params.limit = 20;

        request = $.ajax(apiURL, {
            method: 'GET',
            data: params,
            success: function(response) {
                var videos = response.videos;
                $videos.html('');
                var $row = $videos.children('.row:last');
                if ($row.length == 0) {
                    $row = $('<div class="row"></div>');
                    $videos.append($row);
                }
                Memocast.loadTemplateByName('video-title', function (err, temp) {
                    videos.forEach(function (item) {
                        var childs = $row.children('.mmc-video-item').length;
                        if (childs == 3) {
                            $row = $('<div class="row"></div>');
                            $videos.append($row);
                        }
                        $row.append(temp(item));
                    });
                    Memocast.loadTemplateByName('pager', function (err, temp) {
                        $('#pager').html(temp(response));
                    })
                    // $videosContent.append(html);
                    $loading.hide();
                });
            },
            complete: function () {
                request = false;
            }
        });
    }; // loadVideos
});
