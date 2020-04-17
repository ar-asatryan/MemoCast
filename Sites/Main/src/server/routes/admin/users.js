module.exports = function(req, res) {
    let search = { search : req.query['search'], type: 'users' };
    res.render('admin/users/users', { layout: 'admin', search : search });
};
