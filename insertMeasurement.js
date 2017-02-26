'use strict';

module.exports = function (r, measurement, next) {
	if (!r || !measurement) { return 'Must provide rethinkdbdash and measurement.'; }

	r.table('measurements')
		.insert(measurement, {returnChanges: true})
		.run()
		.then(function (msg) {
			next(null, msg);
		})
		.catch(next);
};