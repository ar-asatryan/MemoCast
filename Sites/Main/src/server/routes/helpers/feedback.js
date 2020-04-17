const express = require('express');
const models = require('../../config/models');

module.exports = function() {

    const router = express.Router();

    router.route('/')
        .get(function(req, res) {
            let data = {
                departments: models.Utils.FeedbackDepartments
            }
            res.render('helpers/feedback', data);
        });

    return router;
};
