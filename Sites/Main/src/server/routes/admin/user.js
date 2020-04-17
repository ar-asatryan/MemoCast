const express = require('express');
const async = require('async');
const models = require('../../config/models');

module.exports = function () {

    let router = express.Router();

    router.use('/:id', function (req, res, next) {
        let userID = req.params['id'];
        models.User.findOne({ _id : userID }, function (err, item) {
            if (err) {
                return res.redirect('/admin/users');
            }
            if (!item) {
                return res.redirect('/admin/users');
            }
            req.selectedUser = item;
            next();
        });
    });

    router.route('/:id')
        .get(function (req, res) {
            let userID = req.params['id'];
            let options = {
                layout : 'admin',
                selectedUser : req.selectedUser,
                credentials : {
                    local : req.selectedUser['local-credentials'] != null && req.selectedUser['local-credentials'].toJSON != {},
                    facebook : req.selectedUser['facebook-credentials'] != null && req.selectedUser['facebook-credentials'].toJSON != {},
                    vk : req.selectedUser['vkontakte-credentials'] != null && req.selectedUser['vkontakte-credentials'].toJSON != {}
                }
            };
            res.render('admin/users/user', options);
        });

    return router;

};
