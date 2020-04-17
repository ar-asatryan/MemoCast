$(function () {
    $(document).on('mouseenter', '.mmc-video-comment', function () {
        var $comment = $(this);
        var userID = $comment.data('user-id');
        var commentID = $comment.data('comment-id');
        var data = {
            user : userID,
            comment : commentID
        };
        if (Memocast.CurrentUserID === userID || Memocast.CurrentUserIsAdmin) {
            $(this).find('.mmc-remove-container').removeClass('d-none');
        }
    });

    $(document).on('mouseleave', '.mmc-video-comment', function () {
        $(this).find('.mmc-remove-container').addClass('d-none');
    });

    $(document).on('click', '.mmc-video-comment .mmc-remove-button', function () {
        var $comment = $(this).closest('.mmc-video-comment');
        var userID = $comment.data('user-id');
        var commentID = $comment.data('comment-id');
        $comment.remove();
        if (userID != '' & commentID != '') {
            var url = '/api/comment/' + commentID;
            console.log(url);
            $.ajax(url, {
                method: 'DELETE',
                success: function (response) {
                    console.log(response);
                },
                error: function (err) {
                    console.log(err);
                }
            });
        }
    });
});
