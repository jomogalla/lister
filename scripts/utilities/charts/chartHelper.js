var utilities = utilities || {};
utilities.chartHelper = {
	
	getProcessedData: function (intervals, startDate, endDate) {

		//Convert intervals to moment ranges
		var rangeIntervals = _.map(intervals,
			function (val) {
				var endDate = (val.dtEnd) ? val.dtEnd : moment(); //if the end time is empty the case is currently being worked, so use current time

				return {
					range: moment.range(val.dtStart, endDate),
					interval: val
				};
			});

		var daysDiff = endDate.diff(startDate, 'days');


		//Build time worked Per Day
		var timeWorkedPerDay = _
			.chain(_.range(0, daysDiff, 0))
			.map(function (val, i) {

				var dayStart = startDate.clone().add(i, "days");
				var dayEnd = dayStart.clone().add(1, "days");
				var range = moment.range(dayStart, dayEnd);
				return { minutesWorked: 0, range: range }
			})
			.value();

		_.forEach(timeWorkedPerDay, function (currentDay, i) {

			var currentDayRange = currentDay.range;

			var minutesForCurrDay =
				_.sumBy(rangeIntervals,
					function (rangeInterval) {
						var dateRange = currentDayRange.intersect(rangeInterval.range);
						return (dateRange) ? dateRange.diff("m") : 0; //intersect in minutes of the current day and this interval
					});

			currentDay.minutesWorked += minutesForCurrDay;
		});

		var daysArray = _.map(timeWorkedPerDay, function (val) {
			return val.range.start;
		});

		var hoursPerDayArray = _.map(timeWorkedPerDay, function (val) {
			return (val.minutesWorked / 60).toFixed(2);
		});

		var totalHours = _.sumBy(hoursPerDayArray, function (val) {
			return parseFloat(val);
		}).toFixed(2);

		return {
			days: daysArray,
			hoursPerDay: hoursPerDayArray,
			totalHours: totalHours
		}
	},
};