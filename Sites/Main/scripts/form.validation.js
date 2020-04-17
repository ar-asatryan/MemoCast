Memocast.formValidation = {
    defaultValidateOptions: function () {
        var opt = {
            focusInvalid: true,
            focusCleanup: true,
            errorElement: 'div',
            errorPlacement: function(error, element) {
                var $el = $(element);
                $el.addClass('form-control-danger');
                error.appendTo( $(element).closest('.form-group') ).addClass('form-control-feedback');
                error.closest('.form-group').addClass('has-danger');
            },
            success: function(error, element) {
                var $el = $(element);
                $el.closest('.form-group').removeClass('has-danger');
                $el.removeClass('form-control-danger');
                error.remove();
            }
        };
        return opt;
    }
};
