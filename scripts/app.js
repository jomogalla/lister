(function () {
	'use strict';

	// TODO: ACTUALLY IMPORT
	var mapState = Vuex.mapState;

	var app = new Vue({
		el: '#app',
		store,
		data: {
			// Pay Period -- Should go in component
			workdays: 0,
			workdaysSoFar: 0,
			payPeriodIntervals: {},
			payPeriodTotal: moment.duration(0, 'minutes'),
			workedDuration: moment.duration(0, 'days'),
			payPeriodStartDate: null,
			payPeriodEndDate: null,
			downloadReady: false,

			// Donuts - Remove from data 
			eightHourDonut: null,
			twentyFourHourDonut: null,
		},
		computed: mapState({
			listView: state => state.ui.listView,
			caseView: state => state.ui.caseView,
			searchView: state => state.ui.searchView,
			payPeriodView: state => state.ui.payPeriodView,
			metricsView: state => state.ui.metricsView,
			settingsView: state => state.ui.settingsView,
			starredCasesView: state => state.ui.starredCasesView,
			stylesInverted: state => state.ui.stylesInverted,
			currentPerson: state => state.controls.currentPerson,
			currentCaseId: state => state.controls.currentCaseId,
			caseActive: state => state.controls.caseActive,
			token: state => state.token,
			hasToken: state => state.hasToken,
			dayToShow: state => state.time.dayToShow,
			timeIntervals: state => state.time.intervals,
			currentViewedCaseId: state => state.case.currentViewedCaseId,
			currentCase: state => state.case.currentCase,
			starredCases: state => state.case.starredCases,
			timeWorked() {
				return this.$store.getters.timeWorked;
			},
			fogbugzLinkUrl () {
				return utilities.authenticator.getFogBugzLinkUrl();
			}
		}),
		watch: {
			timeWorked: function (newTimeWorked) {
				var minutesWorked = Math.floor(newTimeWorked.asMinutes());
				this.eightHourDonut.updateEight(minutesWorked);
			},
			stylesInverted: function() {
				this.stylesInverted ? document.body.classList.add('invert') : document.body.classList.remove('invert');
			}
		},
		mounted: function () {
			// Private properties
			this.$_currentPayPeriod = moment(); 
			//timesheet chart
			this.$_timesheetBar = new utilities.bar('#timesheet-chart', constants.payPeriodBarChartData, constants.weeklyBarChartOptions);

			// Check for saved settings
			store.commit('initializeUI');

			// If we have a token, load her up
			if (utilities.authenticator.hasToken()) {
				this.initializeApp();
			}
		},
		methods: {
			initializeApp: function () {
				var self = this;

				// Setup tokens
				store.commit('setToken', true);

				// Get our timesheet
				this.$store.dispatch('getTimeSheet', this.dayToShow)

				// Make Eight Hour Donut
				this.eightHourDonut = new utilities.donut('#chartone', constants.eightHourDonutData, constants.eightHourDonutOptions);

				//Make 24 hour donut
				this.twentyFourHourDonut = new utilities.donut('#chartclock', constants.twentyFourHourDonutData, constants.twentyFourHourDonutOptions);

				// Load the current user 
				store.dispatch('getPerson');


				// Load Starred Cases
				store.dispatch('getStarredCases');

				// Refresh the charts every second
				setInterval(function () { self.refresher() }, 1000);
			},
			// Move this to utilities
			downloadCSV: function (args) {
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

			formatTimeIntervalsForCSV: function (timeIntervals) {
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
			clearToken: function () {
				utilities.authenticator.clearToken();
				window.location.reload();
			},

			/////////    HTTP Methods     /////////
			setActiveCase: function (ixBug) {
				store.commit('setCurrentCaseId', ixBug);
			},
			startWork: function (caseId) {
				var startWork = {
					"cmd": "startWork",
					"token": utilities.authenticator.getToken(),
					"ixBug": caseId
				};

				utilities.loader.start();
				utilities.api(startWork).then(this.handleStartWorkRequest);

				store.commit('setCurrentCaseId', caseId);
			},
			handleStartWorkRequest: function () {
				store.dispatch('getPerson');
				this.$store.dispatch('getTimeSheet', this.dayToShow)
			},
			stopWork: function () {
				var stopWork = {
					"cmd": "stopWork",
					"token": utilities.authenticator.getToken()
				};

				utilities.loader.start();
				utilities.api(stopWork).then(this.handleResponse);
			},
			handleResponse: function () {
				utilities.loader.stop();
				store.dispatch('getPerson');
				
				this.$store.dispatch('getTimeSheet', this.dayToShow)
				this.setActiveCase();
			},
			getPayPeriodRange: function(dayInPayPeriod) {
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
			getPayPeriod: function(dayInPayPeriod) {
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
			goToPreviousPayPeriod: function () {
				let dates = this.getPayPeriodRange(this.$_currentPayPeriod);
				this.getPayPeriod(dates[0].subtract(1, "days"));
			},
			goToNextPayPeriod: function () {
				let dates = this.getPayPeriodRange(this.$_currentPayPeriod);
				this.getPayPeriod(dates[1].add(1, "days"));

			},
			handlePayPeriodRequest: function (response) {
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
			handleAddPayPeriodProjects: function (response) {
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

			handleErrorRequest: function (response) {				
				var errors = response.responseJSON.errors;

				for(var i = 0; i < errors.length; i++) {
					utilities.notifier.addMessage(errors[i].message);
				}
				
				utilities.loader.stop();
			},
			

			/////////   UI Methods   /////////
			showList: function () {
				store.commit('showList')
			},
			showSearch: function () {
				store.commit('showSearch');
			},
			showCase: function (caseNumber) {
				store.dispatch('getAndShowCase', caseNumber);
			},
			showPayPeriod: function () {
				store.commit('showPayPeriod');

				// TODO add conditional logic to only get this if the pay period has changed or is null
				this.getPayPeriod(this.dayToShow);
			},
			showSettings: function () {
				store.commit('showSettings');
			},
			toggleMetrics: function () {
				store.commit('showMetrics')
			},
			invertColors: function () {
				store.commit('invertColors');
			},
			refresher: function () {
				if (utilities.authenticator.hasToken()) {
					// Need to update getters on store
				//	this.timeWorked = this.calculateTimeWorked(this.timeIntervals.intervals);

					this.twentyFourHourDonut.updateTwentyFour(this.timeIntervals);
				}
			}
		}
	});
})();
