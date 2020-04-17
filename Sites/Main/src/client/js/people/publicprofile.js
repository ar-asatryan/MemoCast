$(function() {

    $('#profile-left-menu li:first').addClass('active');
    $('#profile-tabs .tab-pane:first').addClass('active');

    if (CurrentUserID != '') {
        $('#btn-follow').click(function (evt) {
            evt.preventDefault();
            var url = '/api/social/follow/' + ProfileUserID;
            var method = iAmFollower ? 'DELETE' : 'POST';
            $.ajax(url, {
                method: method,
                success: function (response) {
                },
                error: function (err) {
                },
                complete: function () {
                    loadFollowers();
                }
            })
        });
    }


    var loadFollowers = function () {
        var url = '/api/social/followers/' + ProfileUserID;
        $.ajax(url, {
            method: 'GET',
            success: function (response) {
                var $div = $('#profile-followers');
                var html = '';

                Memocast.loadTemplateByName('person', function (err, temp) {
                    response.forEach(function (item) {
                        html += temp(item);
                    });
                    if (CurrentUserID != '') {
                        var check = response.filter(function (item) {
                            return item.id == CurrentUserID;
                        });
                        setIAmFollower(check.length > 0);
                    }
                    $div.html(html);
                });

                $('#profile-left-menu li a').removeClass('active');
                $('#profile-tabs .tab-pane').removeClass('active');

                if (response.length > 0) {
                    $('#profile-left-menu-item-followers a.nav-link').addClass('active');
                    $('#profile-followers').addClass('active');
                    $('#profile-followers').show();
                    $('#profile-left-menu-item-followers').show();
                } else {
                    $('#profile-left-menu-item-followers').hide();
                    $('#profile-followers').hide();

                    $('#profile-left-menu li a:first').addClass('active');
                    $('#profile-tabs .tab-pane:first').addClass('active');
                }
            }
        });
    };

    var setIAmFollower = function (value) {
        var $bt = $('#btn-follow');
        iAmFollower = value;
        if (iAmFollower) {
            $bt.html('<i class="fa fa-user-plus" aria-hidden="true"></i> Unfollow');
            $bt.removeClass('btn-primary').addClass('btn-secondary');
        } else {
            $bt.html('<i class="fa fa-user-plus" aria-hidden="true"></i> Follow');
            $bt.removeClass('btn-secondary').addClass('btn-primary');
        }
    };

    var loadVideoComments = function() {

        var url = '/api/comment/user/' + SelectedUserID;

        $.ajax(url, {
            method: 'GET',
            success: function(response) {
                Memocast.loadTemplateByName('comments', function (err, temp) {
                    $('#profile-comments').html(temp(response));
                });
            }
        })
    };

   // loadVideoComments();

});
