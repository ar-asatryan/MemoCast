$(function() {

    // load flash adverts
    var loadFlashes = function() {

        var url = '/api/flash';
        $.ajax(url, {
            method: 'GET',
            success: function(response) {
                Memocast.loadTemplateByName('flash-adverts', function (err, temp) {
                    var html = temp(response);
                    $('#flash-adverts').html(html);
                });
            }
        });

    };

    $(document).on('click', '.flash-item', function(evt) {
        evt.preventDefault();
        var url = $(this).attr('data-link');
        if (url && url != '') {
            location.assign(url);
        }
    });

    loadFlashes();

});
