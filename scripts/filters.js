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
		

		if(moment.duration(value).asHours() == 36) {
			debugger;
		}
		if(moment.duration(value).asHours() > 24 ) {
			return (Math.floor(moment.duration(value).asHours()) + 'h ' + moment.duration(value).minutes() + 'm');
		} else if(moment.duration(value).minutes() === 0){
			return (moment.duration(value).hours() + 'h');
		} else {
			return (moment.duration(value).hours() + 'h ' + moment.duration(value).minutes() + 'm');
		}
	});
})();