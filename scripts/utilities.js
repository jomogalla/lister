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
	eightHoursInMinutes: (60 * 8),
	twentyFourHoursInMinutes: (60 * 24)
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
		chart: '',
		initialize: function (id, data, options) {
			var ctx = $(id);
			this.chart = $(id);

			this.chart = new Chart(ctx, {
				type: 'doughnut',
				data: data,
				options: options
			});

			return this;
		},

		update: function (timeData) {
			if(this.chart.options.type = 'eight') {
				var minutesWorked = timeData;
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
					minutesWorked = minutesWorked % constants.eightHoursInMinutes;
					timeLeft = constants.eightHoursInMinutes - (minutesWorked % constants.eightHoursInMinutes);
				}

				this.chart.data.datasets[0].data[0] = minutesWorked;
				this.chart.data.datasets[0].data[1] = timeLeft;
			} else if (this.chart.options.type = 'twentyFour') {
				for (var i = 0; i < timeData.length; i++) {
					this.chart.data.datasets[0].data[i] = timeData[i].time;
					if (timeData[i].bug) {
						this.chart.data.datasets[0].backgroundColor[i] = '#D9E3D6';
						this.chart.data.labels[i] = 'Case ' + timeData[i].bug;
					} else {
						this.chart.data.datasets[0].backgroundColor[i] = '#F9F9F9';
						this.chart.data.labels[i] = 'Free time';
					}
				}
			} else {
				console.warn('Chart Type ' + this.chart.options.type + ' Not Supported');
				this.clear();
			}

			this.chart.update();
		},
		clear: function() {
			this.chart.data.datasets[0].data = [];
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
	donutClock: {
		chart: $('#chartclock'),
		initialize: function (data, options) {
			var ctx = $('#chartclock');

			data.datasets[0].data = [];
			data.labels = [];

			this.chart = new Chart(ctx, {
				type: 'doughnut',
				data: data,
				options: options
			});

		},
		update: function (timeData) {
			for (var i = 0; i < timeData.length; i++) {
				this.chart.data.datasets[0].data[i] = timeData[i].time;
				if (timeData[i].bug) {
					this.chart.data.datasets[0].backgroundColor[i] = '#D9E3D6';
					this.chart.data.labels[i] = 'Case ' + timeData[i].bug;
				} else {
					this.chart.data.datasets[0].backgroundColor[i] = '#F9F9F9';
					this.chart.data.labels[i] = 'Free time';
				}
				
			}
			this.chart.update();
		},

		clear: function() {
			this.chart.data.datasets[0].data = [];
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
	},
	storage: {
		save: function(key, value) {
			localStorage.setItem(key, value);

		},
		load: function (key) {
			return localStorage.getItem(key);
		},
		delete: function(key) {
			localStorage.removeItem(key);
		}
	}
}