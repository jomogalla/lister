(function () {
	'use strict';

	// Turns a moment into whatever format is passed in
	Vue.filter('formatDate', function (value, format = 'MM/DD/YYYY hh:mm') {
		if (!value) return '';

		return moment(value).format(format);
	});

	// Turns a duration into hours & minutes
	Vue.filter('humanizeDuration', function (value) {
		if (!value) return '';

		if(moment.duration(value).asHours() > 24 ) {
			return (Math.floor(moment.duration(value).asHours()) + 'h ' + moment.duration(value).minutes() + 'm');
		} else {
			return (moment.duration(value).hours() + 'h ' + moment.duration(value).minutes() + 'm');
		}
	});
})();