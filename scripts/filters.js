(function () {
	'use strict';

	// Turns a moment into whatever format is passed in
	Vue.filter('formatDate', function (value, format = 'MM/DD/YYYY hh:mm') {
		if (!value) return '';

		return moment(value).format(format);
	});

	// Turns a duration into hours & minutes
	Vue.filter('humanize', function (value) {
		if (!value) return '';

		return (moment.duration(value).hours() + 'h ' + moment.duration(value).minutes() + 'm');
	});
})();