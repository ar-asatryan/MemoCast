$(function () {
    $search = $('#search-form');
    $search.on('submit', function (evt) {
        evt.preventDefault();
        let $form = $(this);
        let data = {};
        $form.serializeArray().forEach(function (item) {
            data[item.name] = item.value;
        });
        let url = '/admin/';
        if (data.type == 'videos') {
            url = '/admin/videos?search=' + data.search;
        } else if (data.type == 'users') {
            url = '/admin/users?search=' + data.search;
        }
        window.location.assign(url);
    });

    $('#tb-search-form-search').focus(function (evt) {
        $(this).select();
    });
});
