var express = require('express');
const models = require('../../config/models');
var router = express.Router();

module.exports = function() {

    router.route('/')
        .get(function(req, res) {
            // res.render('helpers/contacts');
            let data = {
                departments: models.Utils.FeedbackDepartments
            }
            res.render('helpers/feedback', data);
        });

    return router;
};
