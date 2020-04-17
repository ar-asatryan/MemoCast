$(function() {

    var loadVideoComments = function() {
        var $comments = $('#profile-comments');
        var loadAll = $('#cb-comments-show-all').prop('checked');

        var url = '/api/comment/user/' + ProfileUserID;

        $.ajax(url, {
            method: 'GET',
            success: function(response) {
                Memocast.loadTemplateByName('comments', function (err, temp) {
                    $comments.html(temp(response));
                });
            }
        })
    };

   loadVideoComments();

});
