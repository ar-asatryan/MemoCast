var MessagesUtility = {

};

$(function() {

    if (!Memocast.CurrentUserID) {
        return;
    }

    var socket = io(SocketIOAddress);
    socket.on('connect', function () {
        var url = '/api/io/connect';
        var data = { id: this.id };
        if (videoTitleID != '') {
            data.videoTitleID = videoTitleID;
        }
        $.ajax(url, {
            method: 'POST',
            data: data,
            success: function (response) {
                if (SocketEstablishedHandler) {
                    SocketEstablishedHandler();
                }
            },
            error: function (err) {
            }
        });
    });
    socket.on('message', function (data) {
        MessagesUtility.ProcessMessage(data);
    });

    MessagesUtility.GrowlMessage = function(msg) {
        console.log(msg);
        var title = '';
        var message = '';
        var url = '';
        var data = msg.data;
        var t = msg['type'];
        switch (t) {
            case 'personal-message':
                title = data.from.displayName;
                message = data.body;
                url = '/link/im/' + data.id;
                break;
            case 'follower':
                title = data.follower.displayName;
                message = 'New follower';
                url = '/profile/feed';
                break;
            case 'like':
                title = data.user.displayName;
                message = 'Liked video "' + data.videoTitle.title + '"';
                url = '/profile/feed';
                break;
            case 'comment':
                title = data.user.displayName;
                message = 'New comment:\n\n' + data.body;
                url = '/profile/feed';
                break;
            default:

        }
        $.growl.notice({ title: title, message: message, url: url });
    };

    MessagesUtility.ProcessMessage = function(msg) {
        var $bt = $('#bt-feed-popup');
        var className = 'mmc-has-updates';
        if (!$bt.hasClass(className)) {
            $bt.addClass(className);
        }
        MessagesUtility.GrowlMessage(msg);
    };

});
