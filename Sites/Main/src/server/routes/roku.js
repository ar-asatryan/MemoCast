const express = require('express');
const settings = require('../config/settings');
const models = require('../config/models');
const async = require('async');
const crypto = require('crypto');

const DEVICES_PER_ACCOUNT_LIMIT = 2;

function random(howMany, chars) {
	chars = chars
		|| "0123456789";
	var rnd = crypto.randomBytes(howMany)
		, value = new Array(howMany)
		, len = chars.length;

	for (var i = 0; i < howMany; i++) {
		value[i] = chars[rnd[i] % len]
	};

	return value.join('');
}

function createRokuLinkingCode(userID, data, callback) {
	let code = random(4);

	// query
	let query = { user: userID };

	// udate doc
	let createDate = new Date();
	let expireDate = new Date(createDate.getTime() + 15 * 60000);
	let update = {
		user: userID,
		createDate: createDate,
		expireDate: expireDate,
		activated: false,
		code: code
		// code : '112233'
	};
	models.RokuActivationCode.findOneAndUpdate(query, update, { upsert: true, new: true }, function (err, item) {
		if (err) {
			createRokuLinkingCode(userID, data, callback);
		} else {
			data.rokuActivationCode = item;
			callback(null, data);
		}
	})
};

module.exports = function () {

	let router = express.Router();

	router.route('/')
		.get(function (req, res) {
			res.render('roku/index', {
				layout: 'roku',
				appAccessCode: settings.roku.appAccessCode
			});
		});

	router.route('/link')
		.get(function (req, res) {
			async.waterfall([
				// cheking if user authenticated
				function (callback) {
					let data = {
						layout: 'roku',
						gold: req.activeSubscription,
						linked: false,
						canLink: false,
						links: []
					};
					callback(
						!req.user ? { err: 'Not authenticated' } : null,
						data
					);
				},
				// checking if device linked
				function (data, callback) {
					// models.RokuDevice.
					models.RokuDevice.find({ user: req.user._id }).sort({ createDate: 1 })
						.exec(function (err, links) {
							if (err != null) {
								return callback(err);
							}

							data.canLink = links.length < DEVICES_PER_ACCOUNT_LIMIT;
							data.links = links.map(item => {
								return {
									_id: item._id,
									createDate: item.createDate == null ? '' : item.createDate.toDateString()
								}
							});

							if (!data.canLink) {
								data.linked = true;
								return callback({ err: 'already linked' }, data);
							} else {
								data.linked = false;
								return callback(null, data);
							}
						});
				},
				// creating linking code
				function (data, callback) {
					let userID = req.user._id;
					createRokuLinkingCode(userID, data, callback);
				}
			], function (err, result) {
				res.render('roku/link', result);
			});
		})
		.post(function (req, res) {
			if (req.user) {
				let query = { user: req.user._id };
				models.RokuDevice.remove(query, function (err, raw) {
					res.redirect('/roku/link');
				});
			} else {
				res.redirect('/roku/link');
			}
		});

	router.route('/unlink/:id')
		.get(function (req, res, next) {
			if (!req.user) {
				return res.redirect('/roku/link');
			}

			// remove particular device link
			const id = req.params['id'];
			models.RokuDevice.findOneAndRemove({ _id: id, user: req.user._id }, function(err) {
				return res.redirect('/roku/link');
			});

		});

	router.route('/trial')
		.get(function (req, res) {
			res.render('roku/trial', { layout: 'roku' });
		});

	return router;

};
