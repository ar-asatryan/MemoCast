$(function () {

    var $dialog = $('#dialog');
    var template = Handlebars.compile($('#template-personal-message').html());
    var $submit = $('#bt-new-message-submit');
    var $body = $('#tb-new-message-body');
    var $refresh = $('#bt-messages-refresh');

    function loadDialog() {
        var url = '/api/messages/dialog/' + DialogUserID;
        $.ajax(url, {
            method: 'GET',
            success: function (response) {
                displayDialog(response);
            },
            error: function (err) {
            }
        })
    }

    function displayDialog(data) {
        var html = '';
        data.forEach(function (item) {
            html = template(item) + html;
        });
        $dialog.html(html);
        adjustMyMessages();
    }

    function adjustMyMessages() {
        $('.mmc-msg[data-msg-from="' + CurrentUserID + '"]').removeClass('common-message').addClass('bg-success text-white');
    }

    $('#new-message-form').on('submit', function(evt) {
        evt.preventDefault();
        var formData = $(this).serializeArray();
        var data = { };
        formData.forEach(function (item) {
            data[item.name] = item.value;
        });
        var url = '/api/messages';
        $body.prop('readonly', 'readonly');
        $.ajax(url, {
            method: 'POST',
            data: data,
            success: function (response) {
                $body.val('');
                $submit.prop('disabled', null);
                appendMessage(response);
            },
            error: function (err) {

            },
            complete: function () {
                $body.prop('readonly', null);
                $body.focus();
            }
        });
    });

    $('#tb-new-message-body').on('input propertychange paste', function (evt) {
        var val = $(this).val();

        if (val != '') {
            $submit.prop('disabled', null);
        } else {
            $submit.prop('disabled', 'disabled');
        }
    });

    $refresh.on('click', function (evt) {
        evt.preventDefault();
        loadDialog();
    });

    var socket = io(SocketIOAddress);
    socket.on('connect', function () {
        var url = '/api/io/connect';
        $.ajax(url, {
            method: 'POST',
            data: { id: this.id },
            success: function (response) {
            },
            error: function (err) {
            }
        });
    });

    MessagesUtility.ProcessMessage = function (msg) {
        if (msg['type'] == 'personal-message') {
            if ((msg.data.from.id == DialogUserID && msg.data.to == CurrentUserID) ||
                (msg.data.from.id == CurrentUserID && msg.data.to == DialogUserID)) {
                    appendMessage(msg.data);
                } else if (msg.data.to != CurrentUserID) {
                    MessagesUtility.GrowlMessage(msg);
                }
        }

    }

    var appendMessage = function (msg) {
        var html = template(msg);
        var $div = $(html);
        $dialog.prepend($div);
        adjustMyMessages();
    }

    loadDialog();
});
