$(function () {
    $('#tb-user-roles').select2({
        tags: true
    });

    let $mainForm = $('#user-form');
    $mainForm.on('submit', function (evt) {
        evt.preventDefault();
        let data = {};
        $(this).serializeArray().forEach(function (item) {
            data[item.name] = item.value;
        });
        data['roles'] = $('#tb-user-roles').val();
        let userID = data['_id'];
        delete data['_id'];

        let updateOptions = {
            id : userID,
            update: data,
            success: function (response) {
            },
            error: function (err) {
            }
        }

        updateUser(updateOptions);
    });

    let $formVKontakte = $('#user-vk-form');
    $formVKontakte.on('submit', function (evt) {
        evt.preventDefault();
        let data = {};
        $(this).serializeArray().forEach(function (item) {
            data[item.name] = item.value;
        });
        let userID = data['_id'];
        delete data['_id'];

        let updateOptions = {
            id : userID,
            update: { 'vkontakte-credentials' : data },
            success: function (response) {
            },
            error: function (err) {
            }
        }

        updateUser(updateOptions);
    });

    let $formFB = $('#user-fb-form');
    $formFB.on('submit', function (evt) {
        evt.preventDefault();
        let data = {};
        $(this).serializeArray().forEach(function (item) {
            data[item.name] = item.value;
        });
        let userID = data['_id'];
        delete data['_id'];

        let updateOptions = {
            id : userID,
            update: { 'facebook-credentials' : data },
            success: function (response) {
            },
            error: function (err) {
            }
        }

        updateUser(updateOptions);
    });

    let $formLocal = $('#user-local-form');
    $formLocal.on('submit', function (evt) {
        evt.preventDefault();
        let data = {};
        $(this).serializeArray().forEach(function (item) {
            data[item.name] = item.value;
        });
        let userID = data['_id'];
        delete data['_id'];

        let updateOptions = {
            id : userID,
            update: { 'local-credentials' : data },
            success: function (response) {
            },
            error: function (err) {
            }
        }

        updateUser(updateOptions);
    });

    // subscriptions workflow
    let $subsContainer = $('#subs-container');
    let subsTemplate = Handlebars.compile($("#template-subs").html());

    function loadSubscriptions() {
        let id = $('#tb-user-id').val();
        let url = '/api/admin/users/' + id.toString();
        $.ajax(url, {
            method: 'GET',
            success: function (response) {
                let subs = response.subs;
                $subsContainer.html(subsTemplate(subs));
            },
            error: function (err) {
            }
        })
    }

    // datapicker for expire date (new sub)
    $('#tb-user-newsub-expire').datepicker();

    // remove subscription handler
    $(document).on('click', '.mmc-delete-sub-button', function (evt) {
        let $bt = $(this);
        let id = $bt.data('sub-id');
        if (window.confirm('Are you sure?')) {
            let url = '/api/admin/subscriptions/' + id.toString();
            $.ajax(url, {
                method: 'DELETE',
                complete: function () {
                    loadSubscriptions();
                }
            })
        }
    });

    // load subscriptions
    loadSubscriptions();

    // new sub form submit handler
    let $formNewSub = $('#user-newsub-form');
    $formNewSub.on('submit', function (evt) {
        evt.preventDefault();
        let data = {};
        $(this).serializeArray().forEach(function (item) {
            data[item.name] = item.value;
        });
        let userID = data['_id'];

        let update = {
            user : data['_id'],
            subscription: {
                active: true,
                kind: data.kind,
                notes: data.notes,
                expire: new Date(data.expire)
            }
        }

        if (isNaN(update.subscription.expire.getTime())) {
            delete update.subscription.expire;
        }

        if (data.paypal) {
            update.subscription.paypal = {
                id : data.paypal
            }
        }

        if (data.cybersource) {
            if (data.kind == 'recurring') {
                update.subscription.cybersource = {
                    'subscription-id' : data.cybersource
                }
            } else {
                update.subscription.cybersource = {
                    'merchantReferenceCode' : data.cybersource
                }
            }
        }

        let url = '/api/admin/subscriptions';
        $.ajax(url, {
            method: 'POST',
            data: update,
            success: function (response) {
                $formNewSub.trigger('reset');
                loadSubscriptions();
            },
            error: function (err) {
            }
        })
    });

});

function updateUser(options) {
    let url = '/api/admin/users/' + options.id.toString();
    let data = {
        update : options.update
    };
    if (data.update['userID'] === '') {
        delete data.update['userID'];
        data.unset = { userID : 1 };
    }
    $.ajax(url, {
        method: 'PUT',
        data: data,
        success: function (response) {
            if (options.success) {
                options.success(response);
            }
        },
        error: function (err) {
            if (options.error) {
                options.error(err);
            }
        },
        complete: function () {
            if (options.complete) {
                options.complete();
            }
        }
    })
}
