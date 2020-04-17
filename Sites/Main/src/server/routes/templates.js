const express = require('express');
const fs = require('fs');
const path = require('path');

module.exports = function () {

    let router = express.Router();
    let dirpath = [__dirname, ''];

    router.route('/:path')
        .get(function (req, res) {
            let template = req.params['path'];
            let templatePath = path.join(
                __dirname,
                '../../../templates',
                template + '.handlebars'
            );
            fs.access(templatePath, fs.constants.R_OK, function (err) {
                if (err) {
                    res.send(404, 'Template %s not found', template);
                } else {
                    fs.readFile(templatePath, 'utf8', function (err, data) {
                        if (err) {
                            res.send(500, 'Server error');
                        } else {
                            res.set('Content-Type', 'text/x-handlebars-template');
                            // res.set('Cache-Control', 'max-age=3600');
                            res.send(data);
                        }
                    });
                }
            });
        });

    return router;

};
