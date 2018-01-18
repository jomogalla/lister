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

	this.updateTwentyFour = function (timeData) {
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

	this.clear = function () {
		this.chart.data.datasets[0].data = [];
	};
};