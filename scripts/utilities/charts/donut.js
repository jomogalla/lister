var utilities = utilities || {};
utilities.donut = function (id, data, options, updateFunction) {
	var ctx = $(id);
	
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

	this.paintTwentyFour = function (timeData) {
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

	this.updateTwentyFour = function (clockInputData) {
		// This is for the 24 Hour clock.

		if (clockInputData.length === 0) {
			this.clear();
			this.paintTwentyFour([]);
			return;
		}

		if (!clockInputData.length) { return; }
		var date = clockInputData[0].dtStart;
		var startOfDay = moment(date).startOf('day');
		var endOfDay = moment(date).endOf('day');
		var betterClockData = [];

		// Strip the data to just be start & end
		for (var i = 0; i < clockInputData.length; i++) {
			var start = moment(clockInputData[i].dtStart);
			var end = moment(clockInputData[i].dtEnd);
			var bug = clockInputData[i].ixBug;

			// Handle if there is no end time
			if (!clockInputData[i].dtEnd) {
				var end = moment();
			}

			betterClockData.push({
				'bug': bug,
				'start': start,
				'end': end
			});
		}

		var startOfTimeData = [];

		// Turn the data into a bunch of durations
		startOfTimeData.push({
			'time': moment.duration(betterClockData[0].start.diff(startOfDay)).asMinutes(),
			'bug': ''
		});

		for (var i = 0; i < betterClockData.length; i++) {
			startOfTimeData.push({
				'time': moment.duration(betterClockData[i].end.diff(betterClockData[i].start)).asMinutes(),
				'bug': betterClockData[i].bug
			});

			// Calculate the down time between this time entry and the next and add it.
			if (i < betterClockData.length - 1) {
				startOfTimeData.push({
					'time': moment.duration(betterClockData[i + 1].start.diff(betterClockData[i].end)).asMinutes(),
					'bug': ''
				});
			}
		}

		startOfTimeData.push({
			'time': moment.duration(endOfDay.diff(betterClockData[betterClockData.length - 1].end)).asMinutes(),
			'bug': ''
		});

		this.clear();
		this.paintTwentyFour(startOfTimeData);
	}

	this.clear = function () {
		this.chart.data.datasets[0].data = [];
	};
};