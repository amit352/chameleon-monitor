'use strict';
var nodemailer = require('nodemailer');
var config = require('./config.js');

config = config.hasOwnProperty('email')
		? config
		: {
			email: {
				user: 'yourGmailAccount',
				pass: 'yourGmailPasssword'
			}
	};

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: config.email.user,
		pass: config.email.pass
	}
});

// setup email data with unicode symbols
var mailOptions = {
	from: '"Chameleon Monitoring System" <support@chameleon-monitor.com>', // sender address
	to: config.email.user, // list of receivers
	subject: 'High drain level', // Subject line
	html: '<b>High Level Alert!</b> <p>The drain is reaching a high level and should be emptied.</p>' // html body
};

module.exports = function (lastEmailDate, cb) {
	var halfHour = 3600000/2;
	if (Date.now() - lastEmailDate < halfHour) {
		return cb(null, 'alreadySent');
	}

	// send mail with defined transport object
	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			return cb(error);
		}

		cb(null, info.response);
	});
};