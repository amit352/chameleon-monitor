'use strict';

// returns the historical data for this type of measurement
// type --> 'temp' || 'uv'
module.exports = function (r, type, next) {
	if (!r || !type) { return 'Must provide rethinkdbdash and measurement type.'; }

	r.table('measurements')
		.pluck([type, 'date'])
		.orderBy(r.asc('date'))
		.limit(50000)
		.map(function (m) {
			return [m('date'), m(type)];
		})
		.then(function (results) {
			next(null, results);
		})
		.catch(next);
};