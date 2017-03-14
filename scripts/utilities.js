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
		token: '',
		subDomain: '',
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
			this.token = token;
			utilities.storage.save('token', token);
			return this.token;
		},
		getToken: function () {
			if (this.token) {
				return this.token;
			} else {
				var token = utilities.storage.load('token');
				this.token = token;
				return token;
			}
		},
		addSubDomain: function (subDomain) {
			this.subDomain = subDomain;
		},
		getSubDomain: function () {
			return this.subDomain;
		},
		hasToken: function () {
			return (utilities.storage.load('token') || this.token);
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
	donut: function(id, data, options, updateFunction) {
		var ctx = $(id);
		// this.chart = $(id);

		this.chart = new Chart(ctx, {
			type: 'doughnut',
			data: data,
			options: options
		});

		this.updateEight = function (timeData) {
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

			this.chart.update();
		};

		this.updateTwentyFour = function(timeData) {
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
		};

		this.clear = function() {
			this.chart.data.datasets[0].data = [];
		};
	},
	router: {
		routes: {
			//takes a date?
			'timesheet': {
				'name': 'Timesheet',
				'url': '/time',
			},
			//Takes a case number
			'case': {
				'name': 'Case',
				'url': '/case'
			},
			// takes a search parameter
			'search': {
				'name': 'Search',
				'url': '/search'
			},
			// takes a Month and 1 or 2
			'report': {
				'name': 'Report',
				'url': '/report',

			},
			// takes nothing
			'logon': {
				'name': 'logon',
				'url': '/logon'
			},
			'otherwise': {
				name: '',
				url: '/'
			}
		},
		state: {
			title: '',
			parameters: {},
			
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