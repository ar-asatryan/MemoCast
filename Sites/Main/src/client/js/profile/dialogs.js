$(function () {

    var dialogsTemplate = Handlebars.compile($('#template-dialogs').html());
    var $dialogs = $('#dialogs');

    function loadDialogs() {
        var url = '/api/messages/dialogs';
        $.ajax(url, {
            method: 'GET',
            success: function (response) {
                displayDialogs(response);
            },
            error: function (err) {
            }
        });
    };

    function displayDialogs(data) {
        $dialogs.html(dialogsTemplate(data));
    }

    loadDialogs();
});
