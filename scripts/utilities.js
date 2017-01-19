// This const is worthless
const constants = {
	fogbugzUrl: 'https://altsource.fogbugz.com/f/api/0/jsonapi',
	requestType: 'POST',
	contentType: 'text/plain',
	token: '',
	yellow: '#FFCE56',
	red: '#FF6384',
	blue: '#36A2EB',
	firstEight: [
		"#FF6384",
		"#FFCE56"
	],
	firstEightHover: [
		"#FF6384",
		"#FFCE56"
	],
	secondEight: [
		"#FF6384",
		"#36A2EB"
	],
	secondEightHover: [
		"#FFCE56",
		"#36A2EB"
	],
	eightHoursInMinutes: (60 * 8)
};

var variables = {
	token: ''
};

var utilities = {
	api: function (requestObject) {
		return $.ajax({
			url: constants.fogbugzUrl,
			type: constants.requestType,
			data: JSON.stringify(requestObject),
			contentType: constants.contentType,
		})
	},
	authenticator: {
		logon: function (email, password) {
			var self = this;
			var logonObject = {
				"cmd": "logon",
				"email": email,
				"password": password
			};

			utilities.api(logonObject).then(function (response) {
				var parsedResponse = JSON.parse(response)
				if (!parsedResponse.errorCode) {
					self.addToken(parsedResponse.data.token);
					return true;
				} else {
					return false;
				}
			});
		},
		logoff: function (token) {

		},
		addToken: function (token) {
			variables.token = token;
			return variables.token;
		},
		getToken: function () {
			return variables.token;
		}
	},
	loader: {
		start: function (message) {
			if (message) {
				$('#loader').text(message);
			} else {
				$('#loader').html('<i class="fa fa-asterisk fa-spin fa-fw"></i>');
			}
			$('#loader').fadeIn();

		},
		stop: function () {
			$('#loader').fadeOut();
		}
	},
	donut: {
		chart: $('#chartone'),
		initialize: function (data, options) {
			var ctx = $('#chartone');

			this.chart = new Chart(ctx, {
				type: 'doughnut',
				data: data,
				options: options
			});

		},

		update: function (minutesWorked) {
			var timeLeft = (constants.eightHoursInMinutes - minutesWorked);

			// Update Colors First
			if (minutesWorked > constants.eightHoursInMinutes) {
				this.chart.data.datasets[0].backgroundColor = constants.secondEight;
				this.chart.data.datasets[0].hoverBackgroundColor = constants.secondEightHover;
			} else if (minutesWorked === constants.eightHoursInMinutes) {
				this.chart.data.datasets[0].backgroundColor = [constants.blue, constants.blue];
				this.chart.data.datasets[0].hoverBackgroundColor = [constants.blue, constants.blue];
			} else {

				this.chart.data.datasets[0].backgroundColor = constants.firstEight;
				this.chart.data.datasets[0].hoverBackgroundColor = constants.firstEightHover;
			}

			// Modify the data to match the first go around
			if (timeLeft < 0) {
				// timeLeft = (minutesWorked % constants.eightHoursInMinutes);
				minutesWorked = minutesWorked % constants.eightHoursInMinutes;
				timeLeft = constants.eightHoursInMinutes - (minutesWorked % constants.eightHoursInMinutes);

				// timeLeft = constants.eightHoursInMinutes * 2 - minutesWorked % constants.eightHoursInMinutes;
			}

			this.chart.data.datasets[0].data[0] = minutesWorked;
			this.chart.data.datasets[0].data[1] = timeLeft;

			this.chart.update();
		},
		generateDataset: function (minutesWorked) {
			var eightHoursInMinutes = 60 * 8;
			var timeLeft = eightHoursInMinutes - minutesWorked;

			return {
				labels: [
					"Time Worked",
					"Time Left"
				],
				datasets: [
					{
						data: [minutesWorked, timeLeft],
						backgroundColor: [
							"#FF6384",
							"#FFCE56"
						],
						hoverBackgroundColor: [
							"#FF6384",
							"#FFCE56"
						]
					}
				]
			};
		}
	},
	router: {
		routes: {
			'timesheet': {
				name: 'Timesheet',
				url: '/timesheet/'
			},
			'case': 'Case',
			'search': 'case'
		},
		state: {
			title: 'welcome',
			parameters: {}
		},
		initializeState: function () {

		},
		go: function (route, parameters) {

			this.state = {}
			if (!this.routes[route]) {
				console.error('Unable to locate route: ', route);
				return;
			}

			window.history.pushState(this.state, this.routes[route].name, (this.routes[route].url))
		},
		pushState: function () { },
		getState: function () { }
	}
}