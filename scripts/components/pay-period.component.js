var mapState = Vuex.mapState;

Vue.component('pay-period', {
	data() {
		return {
			workdays: 0,
			workdaysSoFar: 0,
			payPeriodIntervals: {},
			payPeriodTotal: moment.duration(0, 'minutes'),
			workedDuration: moment.duration(0, 'days'),
			payPeriodStartDate: null,
			payPeriodEndDate: null,
			downloadReady: false
		};
	},
	computed: mapState({
		payPeriodView: state => state.ui.payPeriodView,
		dayToShow: state => state.time.dayToShow,
		currentPerson: state => state.controls.currentPerson,
		fogbugzLinkUrl() { return utilities.authenticator.getFogBugzCasePrefix(); }
	}),
	watch: {
		payPeriodView(val) {
			if(val) { 
				// Move this to router if that ever happens
				this.getPayPeriod(this.dayToShow);
			}
		}
	},
	mounted() {
		this.$_currentPayPeriod = moment(); 
		// timesheet chart
		this.$_timesheetBar = new utilities.bar('#timesheet-chart', constants.payPeriodBarChartData, constants.weeklyBarChartOptions);

	},
	methods: {
		// Move this to utilities
		downloadCSV(args) {
			var data, filename, link;
			var csv = utilities.convertArrayOfObjectsToCSV({
				data: this.formatTimeIntervalsForCSV(this.payPeriodIntervals)
			});
			if (csv == null) return;

			var fullname = this.currentPerson.sFullName.replace(' ', '');
			var startDate = this.payPeriodStartDate.format('MMMM_D');
			var endDate = this.payPeriodEndDate.format('D');
			var year = this.payPeriodEndDate.format('YYYY');


			filename = fullname + '_' + startDate + '-' + endDate + '_' + year + '.csv';

			if (!csv.match(/^data:text\/csv/i)) {
				csv = 'data:text/csv;charset=utf-8,' + csv;
			}
			data = encodeURI(csv);

			link = document.createElement('a');
			link.setAttribute('href', data);
			link.setAttribute('download', filename);
			link.click();
		},

		formatTimeIntervalsForCSV(timeIntervals) {
			var formattedIntervals = [];

			// TODO - Get the project for each case???
			for (var i = 0; i < timeIntervals.length; i++) {
				if(!timeIntervals[i].dtEnd) { break; 	}

				formattedIntervals.push({
					'Start': moment(timeIntervals[i].dtStart).format('M/D/YYYY h:mm A'),
					'End': moment(timeIntervals[i].dtEnd).format('M/D/YYYY h:mm A'),
					'Duration (Min)': Math.round(utilities.dataPreparation.getDuration(timeIntervals[i].dtStart, timeIntervals[i].dtEnd).asMinutes() * 100) / 100,
					'Project': timeIntervals[i].sProject,
					'Case': timeIntervals[i].ixBug,
					'Title': timeIntervals[i].sTitle,
					'User': this.currentPerson.sFullName
				});
			}

			return formattedIntervals;
		},
		getPayPeriodRange(dayInPayPeriod) {
			// if the date <= 15, startTime = 1st & endTime = 15th
			// otherwise, startTime = 16th & endTime = last day of month
			if (dayInPayPeriod.date() <= 15) {
				var startTime = new moment(dayInPayPeriod).startOf('month');
				var endTime = new moment(dayInPayPeriod).date(15).endOf('day');
			} else {
				var startTime = new moment(dayInPayPeriod).date(16).startOf('day');
				var endTime = new moment(dayInPayPeriod).endOf('month');
			}
			return [startTime, endTime];
		},
		getPayPeriod(dayInPayPeriod) {
			this.downloadReady = false;
			var times = this.getPayPeriodRange(dayInPayPeriod);
			this.$_currentPayPeriod = times[0].clone();
			var startTime = times[0];
			var endTime = times[1];
			this.workdays = utilities.dataPreparation.getWorkdaysForPeriod(startTime, endTime);

			// TODO - Update variable name workdaysSoFar
			// If current time is between startTime & endTime, calculate workdays from startTime to now.
			if(moment().isBetween(startTime, endTime)) {
				this.workdaysSoFar = utilities.dataPreparation.getWorkdaysForPeriod(startTime, moment());
			} else {
				this.workdaysSoFar = utilities.dataPreparation.getWorkdaysForPeriod(startTime, endTime);
			}

			this.workedDuration = moment.duration((this.workdaysSoFar * 8), 'hours');

			this.payPeriodStartDate = startTime;
			this.payPeriodEndDate = endTime;

			var listIntervalsForDate = {
				"cmd": "listIntervals",
				"token": utilities.authenticator.getToken(),
				"dtStart": startTime.toJSON(),
				"dtEnd": endTime.toJSON()
			};

			utilities.loader.start();
			utilities.api(listIntervalsForDate).then(this.handlePayPeriodRequest);
		},
		goToPreviousPayPeriod() {
			let dates = this.getPayPeriodRange(this.$_currentPayPeriod);
			this.getPayPeriod(dates[0].subtract(1, "days"));
		},
		goToNextPayPeriod: function () {
			let dates = this.getPayPeriodRange(this.$_currentPayPeriod);
			this.getPayPeriod(dates[1].add(1, "days"));

		},
		handlePayPeriodRequest(response) {
			this.payPeriodIntervals = typeof response === 'object' ? response.data.intervals : JSON.parse(response).data.intervals;
			this.payPeriodIntervals = utilities.dataPreparation.addDurations(this.payPeriodIntervals);
			this.payPeriodTotal = utilities.dataPreparation.sumDurations(this.payPeriodIntervals);

			//Update Chart stuff
			var intervalData = utilities.chartHelper.getProcessedData(this.payPeriodIntervals,this.payPeriodStartDate,this.payPeriodEndDate);

			var labels = _.map(intervalData.days, function (val) { return val.format('dddd M.DD'); });

			this.$_timesheetBar.updateLabels(labels);
			this.$_timesheetBar.updateData(intervalData.hoursPerDay);

			this.addPayPeriodProjects(this.payPeriodIntervals);
			utilities.loader.stop();
		},
		addPayPeriodProjects(intervals) {
			if(!intervals.length) { return; }
			var caseList = [];

			for(var i = 0; i < intervals.length; i++) {
				var preExisting = caseList.includes(intervals[i].ixBug);

				if(!preExisting) {
					caseList.push(intervals[i].ixBug);
				}
			}
			
			var joinedCaseList = caseList.join(',');

			var search = {
				"cmd": "search",
				"token": utilities.authenticator.getToken(),
				"q": joinedCaseList,
				"max": 200,
				"cols": ["sProject"]
			};

			utilities.loader.start();
			utilities.api(search).then(this.handleAddPayPeriodProjects);
		},
		handleAddPayPeriodProjects(response) {
			utilities.loader.stop();
			var self = this;
			var caseToProjectMap = response.data.cases;

			for(var i = 0; i < this.payPeriodIntervals.length; i++) {
				var caseData = caseToProjectMap.find(function(element) {
					return element.ixBug === self.payPeriodIntervals[i].ixBug;
				});

				this.payPeriodIntervals[i].sProject = caseData.sProject;
			}

			this.downloadReady = true;
		},
	},
	template: '#pay-period-template'
});