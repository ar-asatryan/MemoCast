$(function() {

    var thet = new Tether({
        element: document.getElementById('mmc-autocomplete'),
        target: document.getElementById('tb-videos-autocomplete'),
        attachment: 'top left',
        targetAttachment: 'bottom left'
    });

    var request = null;

    var $auto = $('#mmc-autocomplete');

    // $(document).on('click', '.mmc-autocomplete .row', function (evt) {
    //     evt.preventDefault();
    //     var $item = $(this);
    //     var url = $item.data('mmc-link');
    //     console.log({ url : url });
    //     location.assign(url);
    // });

    $('.memocast-autocomplete-videos').on('focus', function () {
    });

    $('.memocast-autocomplete-videos').on('focusout', function (evt) {
        if (evt.relatedTarget) {
            var $el = $(evt.relatedTarget);
            var url = $el.data('mmc-link');
            console.log({ url : url });
            if (typeof url == 'string' && url != '') {
                // location.assign(url);
            }
        }
    });

    $('.memocast-autocomplete-videos').on('keyup', function (evt) {
        var $input = $(this);
        var str = $input.val();
        var minSearchLength = 3;
        if (str && typeof str == 'string') {
            if (str.length >= minSearchLength) {
                var url = '/api/autocomplete/videos';
                var data = { search : str, limit : 6 };

                if (request) {
                    request.abort();
                    request = null;
                }

                request = $.ajax(url, {
                    method: 'GET',
                    data: data,
                    success: function (response) {
                        if (response.length > 0) {
                            Memocast.loadTemplateByName('autocomplete', function (err, template) {
                                var html = template(response);
                                $auto.html(html);
                                $auto.show();
                            });
                        } else {
                            $auto.hide();
                        }
                    },
                    error: function (err) {
                    },
                    complete: function () {
                        request = null;
                    }
                });
            } // if (str.length >= minSearchLength) ...
            else {
                if (request) {
                    request.abort();
                    request = null;
                }
            } // if (str.length >= minSearchLength) ... else ...
        }
    });
});
