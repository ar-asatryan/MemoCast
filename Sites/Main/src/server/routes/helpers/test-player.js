const express = require('express');

module.exports = () => {
    let router = express.Router();
    router.route('/')
        .get((req, res) => {
            res.render('helpers/test-player');
        });

    return router;
}
