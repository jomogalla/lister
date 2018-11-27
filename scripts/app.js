(function () {
	'use strict';

	// TODO: ACTUALLY IMPORT
	var mapState = Vuex.mapState;

	var app = new Vue({
		el: '#app',
		store,
		data: {
			// General
		//	hasToken: false,
		//	timeWorked: moment.duration(0, 'minutes'),
		//	stylesInverted: null,

			// Controls
		//	currentPerson: {},
		//	currentCaseId: null,
		//	caseActive: false,

			// Cases
			currentViewedCaseId: null,
			currentCase: {},
			starredCases: [],

			// Search - Should go in component
			searchQuery: '',
			searchResults: {},

			// Timesheet
			//dayToShow: moment(),
			//timeIntervals: {},

			// Pay Period -- Should go in component
			workdays: 0,
			workdaysSoFar: 0,
			payPeriodIntervals: {},
			payPeriodTotal: moment.duration(0, 'minutes'),
			workedDuration: moment.duration(0, 'days'),
			payPeriodStartDate: null,
			payPeriodEndDate: null,
			downloadReady: false,

			// Metrics - Should go in component
			metricsTitle: "",
			metricsTotalHours: 0,

			// Login - Should go in component
			//token: null,
			username: '',
			password: '',
			subdomain: '',

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
			timeWorked() {
				return this.$store.getters.timeWorked;
			},
			fogbugzLinkUrl () {
				return constants.httpsUrlPrefix + utilities.authenticator.getSubDomain() + constants.externalLinkSuffix;
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
			this.$_bar = new utilities.bar('#metrics-chart', constants.weeklyBarChartData, constants.weeklyBarChartOptions);
			this.$_currentMetricDate = moment();
			
			//timesheet chart
			this.$_timesheetBar = new utilities.bar('#timesheet-chart', constants.payPeriodBarChartData, constants.weeklyBarChartOptions);

			// Check for saved settings
			//this.stylesInverted = JSON.parse(utilities.storage.load('stylesInverted'));
			store.commit('initializeUI');

			// If we have a subdomain - populate plz.
			this.subdomain = utilities.authenticator.getSubDomain();

			// If we have a token, load her up
			if (utilities.authenticator.hasToken()) {
				this.initializeApp();
			}
		},
		methods: {
			initializeApp: function () {
				var self = this;

				// Setup links - (not sure that this is better than having the link hardcoded....)
			//	this.fogbugzLinkUrl = constants.httpsUrlPrefix + utilities.authenticator.getSubDomain() + constants.externalLinkSuffix;

				// Setup tokens
			//	this.token = utilities.authenticator.getToken();
			//	this.hasToken = true;
				store.commit('setToken', true);

				// Get our timesheet
				// this.getTimeSheet(this.dayToShow);
				this.$store.dispatch('getTimeSheet', this.dayToShow)

				// Make Eight Hour Donut
				this.eightHourDonut = new utilities.donut('#chartone', constants.eightHourDonutData, constants.eightHourDonutOptions);

				//Make 24 hour donut
				this.twentyFourHourDonut = new utilities.donut('#chartclock', constants.twentyFourHourDonutData, constants.twentyFourHourDonutOptions);

				// Load the current user 
				//this.getPerson();
				store.dispatch('getPerson');


				// Load Starred Cases
				this.getStarredCases();

				// Refresh the charts every second
				setInterval(function () { self.refresher() }, 60000);
			},
			downloadCSV: function (args) {
				var data, filename, link;
				var csv = utilities.convertArrayOfObjectsToCSV({
					data: this.formatTimeIntervalsForCSV(this.payPeriodIntervals)
				});
				if (csv == null) return;

				// filename = args.filename || 'export.csv';
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
			updateCaseById: function (caseId) {
				if (caseId === this.currentCase.ixBug) { return; }

				this.getCaseByNumber(caseId)
			},

			resetCurrentCaseId: function () {
				if (this.currentCase.ixBug !== this.currentViewedCaseId) {
					this.currentViewedCaseId = this.currentCase.ixBug;
				}
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

			/////////   Data Preparation Methods   /////////
			prepareClockData: function (clockInputData, donut) {
				// This is for the 24 Hour clock.

				if (this.timeIntervals.length === 0) {
					donut.clear();
					donut.updateTwentyFour([]);
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

				donut.clear();
				donut.updateTwentyFour(startOfTimeData);
			},
			// sumDurations: function (intervals) {
			// 	// This method assumes that the intervals array objects have durations
			// 	var sum = moment.duration(0, 'minutes');

			// 	for (var i = 0; i < intervals.length; i++) {
			// 		if (intervals[i].duration) {
			// 			sum = sum.add(intervals[i].duration);
			// 		}
			// 	}

			// 	return sum;
			// },
			// addDurations: function (intervals) {
			// 	for (var i = 0; i < intervals.length; i++) {
			// 		intervals[i].duration = utilities.dataPreparation.getDuration(intervals[i].dtStart, intervals[i].dtEnd);
			// 	}

			// 	return intervals;
			// },
			// getDuration: function (start, end) {
			// 	if (start && end) {
			// 		var startMoment = moment(start);
			// 		var endMoment = moment(end);
			// 	} else if (start && !end) {
			// 		// Use the current time as end if we dont have one
			// 		var startMoment = moment(start);
			// 		var endMoment = moment();
			// 	} else {
			// 		return moment.duration(0, 'minutes');
			// 	}

			// 	return moment.duration(endMoment.diff(startMoment));
			// },
			// calculateTimeWorked: function (intervals, donut) {
			// 	//This is for The 8 Hour Clock
			// 	var timeWorked = moment.duration(0);
			// 	if (!intervals) {
			// 		return 0;
			// 	}

			// 	for (var i = 0; i < intervals.length; i++) {
			// 		var startMoment = moment(intervals[i].dtStart)
			// 		if (intervals[i].dtEnd) {
			// 			var endMoment = moment(intervals[i].dtEnd)
			// 		} else {
			// 			var endMoment = moment();
			// 			this.setActiveCase(intervals[i].ixBug);
			// 		}


			// 		var duration = moment.duration(endMoment.diff(startMoment));

			// 		timeWorked = timeWorked.add(duration);
			// 	}

			// 	return timeWorked;
			// },
			// getWorkdaysForPeriod: function (startDay, endDay) {
			// 	var days = 0;
			// 	var tempDay = moment(startDay);

			// 	while (tempDay.isBefore(endDay)) {
			// 		if (tempDay.day() !== 0 && tempDay.day() !== 6) {
			// 			days++;
			// 		}
			// 		tempDay.add(1, 'days');
			// 	}

			// 	return days;
			// },

			/////////    HTTP Methods     /////////
			setActiveCase: function (ixBug) {
				//this.currentCaseId = ixBug;
				store.commit('setCurrentCaseId', ixBug);
			},
			search: function () {
				var search = {
					"cmd": "search",
					"token": utilities.authenticator.getToken(),
					"q": this.searchQuery,
					"max": 50,
					"cols": ["sTitle", "sStatus"]
				};

				utilities.loader.start();
				utilities.api(search).then(this.handleSearchRequest);
			},
			handleSearchRequest: function (response) {
				this.searchResults = typeof response === 'object' ? response.data : JSON.parse(response).data;
				utilities.loader.stop();
			},
			getStarredCases: function () {
				var listCases = {
					"cmd": "listCases",
					"cols": ["ixBug","sTitle"],
					"token": utilities.authenticator.getToken(),
					"sFilter": constants.starredByFilterId
				};

				utilities.loader.start();
				utilities.api(listCases).then(this.handleStarredCases);
			},
			handleStarredCases: function (response) {
				utilities.loader.stop();
				this.starredCases = response.data.cases;
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
				//this.currentCaseId = caseId;
			},
			handleStartWorkRequest: function () {
				//this.getPerson();
				store.dispatch('getPerson');
				this.$store.dispatch('getTimeSheet', this.dayToShow)
				//this.getTimeSheet(this.dayToShow);
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
				//this.getPerson();
				store.dispatch('getPerson');
				
				// this.getTimeSheet(this.dayToShow);
				this.$store.dispatch('getTimeSheet', this.dayToShow)
				this.setActiveCase();
			},
			deleteInterval: function (timeIntervalId) {
				var deleteInterval = {
					"cmd": "deleteInterval",
					"ixInterval": timeIntervalId,
					"token": utilities.authenticator.getToken()
				};

				utilities.loader.start();
				utilities.api(deleteInterval).then(this.handleDeleteInterval, this.handleErrorRequest);
			},
			handleDeleteInterval: function (response) {
				utilities.loader.stop();

				this.$store.dispatch('getTimeSheet', this.dayToShow)
				//this.getTimeSheet(this.dayToShow);

			},
			getCaseByNumber: function (caseNumber) {
				if (caseNumber === this.currentCase.ixBug) { return; }

				this.currentViewedCaseId = caseNumber;

				var getCase = {
					"cmd": "search",
					"token": utilities.authenticator.getToken(),
					"q": caseNumber,
					"max": 1,
					"cols": ["ixBug", "ixBugParent", "sTitle", "dblStoryPts", "hrsElapsed", "sLatestTextSummary", "ixBugEventLatestText", "events"]
				};

				utilities.loader.start();
				utilities.api(getCase).then(this.handleCaseRequest);
			},
			handleCaseRequest: function (response) {
				utilities.loader.stop();
				var responseObject = typeof response === 'object' ? response.data.cases[0] : JSON.parse(response).data.cases[0];

				// Check to make sure we have a case
				if (response.data.totalHits !== 0) {
					this.currentCase = responseObject;
					this.currentViewedCaseId = this.currentCase.ixBug;
				} else {
					this.currentViewedCaseId = this.currentCase.ixBug || null;
				}
			},
			editInterval: function (ixInterval, dtStart, dtEnd) {
				var editInterval = {
					"cmd": "editInterval",
					"token": utilities.authenticator.getToken(),
					"ixInterval": ixInterval
				}
				if (dtStart) {
					editInterval.dtStart = dtStart;
				}

				if (dtEnd) {
					editInterval.dtEnd = dtEnd;
				}

				utilities.loader.start();
				utilities.api(editInterval).then(this.handleEditIntervalRequest, this.handleErrorRequest);
			},
			handleEditIntervalRequest: function (response) {
				utilities.loader.stop();
				this.getTimeSheet(this.dayToShow);
			},
			addInterval: function (ixBug, dtStart, dtEnd) {
				if(dtStart._isAMomentObject) {
					dtStart = dtStart.toISOString();	
				}

				if(dtEnd._isAMomentObject) {
					dtEnd = dtEnd.toISOString();	
				}

				var addInterval = {
					"cmd": "newInterval",
					"token": utilities.authenticator.getToken(),
					"ixBug": ixBug,
					"dtStart": dtStart,
					"dtEnd": dtEnd
				}

				utilities.loader.start();
				utilities.api(addInterval).then(this.handleAddIntervalRequest, this.handleErrorRequest);
			},
			handleAddIntervalRequest: function(response) {
				utilities.loader.stop();
				this.$store.dispatch('getTimeSheet', this.dayToShow)
				//this.getTimeSheet(this.dayToShow);
			},
			// Clear time works by adding time to a case, then deleting the interval we just created.
			clearTime: function(dtStart, dtEnd) {
				if(dtStart._isAMomentObject) {
					dtStart = dtStart.toISOString();	
				}

				if(dtEnd._isAMomentObject) {
					dtEnd = dtEnd.toISOString();	
				}

				var addInterval = {
					"cmd": "newInterval",
					"token": utilities.authenticator.getToken(),
					"ixBug": constants.deleteCaseId,
					"dtStart": dtStart,
					"dtEnd": dtEnd
				}
;
				utilities.loader.start();
				utilities.api(addInterval).then(this.handleClearTimeRequest);
			},
			handleClearTimeRequest: function(response) {
				this.deleteInterval(response.data.interval.ixInterval)
			},

			getPayPeriod: function (dayInPayPeriod) {
				this.downloadReady = false;

				// if the date <= 15, startTime = 1st & endTime = 15th
				// otherwise, startTime = 16th & endTime = last day of month
				if (dayInPayPeriod.date() <= 15) {
					var startTime = new moment(dayInPayPeriod).startOf('month');
					var endTime = new moment(dayInPayPeriod).date(15).endOf('day');
				} else {
					var startTime = new moment(dayInPayPeriod).date(16).startOf('day');
					var endTime = new moment(dayInPayPeriod).endOf('month');
				}

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
			// getPerson: function () {
			// 	var viewPerson = {
			// 		"cmd": "viewPerson",
			// 		"token": utilities.authenticator.getToken()
			// 	};

			// 	utilities.loader.start();
			// 	utilities.api(viewPerson).then(this.handlePersonRequest);
			// },
			// handlePersonRequest: function (response) {
			// 	this.currentPerson = typeof response === 'object' ? response.data.person : JSON.parse(response).data.person;
			// 	utilities.loader.stop();
			// },

			//METRICS
			getMetrics: function (targetDate) {
				this.$_currentMetricDate = targetDate.clone();

				var startTime = targetDate.clone().startOf('week');
				var endTime = targetDate.clone().endOf('week');
				var dFormat = "M.DD";

				this.metricsTitle = "Hours for " + startTime.format(dFormat) + " to " + endTime.format(dFormat);

				var listIntervalsForDate = {
					"cmd": "listIntervals",
					"token": utilities.authenticator.getToken(),
					"dtStart": startTime.toJSON(),
					"dtEnd": endTime.toJSON()
				};

				var vm = this;
				utilities.loader.start();
				utilities.api(listIntervalsForDate).then(function (response) {
					var intervals = typeof response === 'object' ? response.data.intervals : JSON.parse(response).data.intervals;
					utilities.loader.stop();

					var intervalData = utilities.chartHelper.getProcessedData(intervals, startTime, endTime);
					vm.metricsTotalHours = intervalData.totalHours;

					vm.$_bar.updateData(intervalData.hoursPerDay);
				});

			},

			goToPreviousWeekMetrics: function() {
				var targetDate = this.$_currentMetricDate.clone().subtract(1, "w");
				this.getMetrics(targetDate);
			},

			goToNextWeekMetrics: function() {
				var targetDate = this.$_currentMetricDate.clone().add(1, "w");
				this.getMetrics(targetDate);
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
				store.commit('showCase');

				// TODO add logic to only get this if the case has changed or is null
				this.getCaseByNumber(caseNumber);

			},
			showPayPeriod: function () {
				store.commit('showPayPeriod');

				// TODO add conditional logic to only get this if the pay period has changed or is null
				this.getPayPeriod(this.dayToShow);
			},
			showSettings: function () {
				store.commit('showSettings');
			},
			showStarredCases: function () {
				store.commit('showStarredCases');
			},
			hideStarredCases: function () {
				store.commit('hideStarredCases');
			},
			toggleMetrics: function () {
				store.commit('showMetrics')

				//initialize metrics data
				this.getMetrics(moment());
			},
			showPreviousDay: function () {
				let previousDay = this.dayToShow.subtract(1, 'days');
				this.$store.dispatch('getTimeSheet', previousDay)
				//this.getTimeSheet();
			},
			showNextDay: function () {
				let nextDay = this.dayToShow.add(1, 'days');
				this.$store.dispatch('getTimeSheet', nextDay)

				//this.getTimeSheet();
			},
			skipToMonday: function () {
				let monday = this.dayToShow.add(3, 'days');
				this.$store.dispatch('getTimeSheet', monday)

				//this.getTimeSheet();
			},
			skipToFriday: function () {
				let friday = this.dayToShow.subtract(3, 'days');
				this.$store.dispatch('getTimeSheet', friday);
				
				//this.getTimeSheet();
			},
			showToday: function () {
				var today = new moment();

				if (!today.isSame(this.dayToShow, 'day')) {
					this.showDay();
				}
			},
			showDay: function (day) {
				day = new moment(day);

				this.$store.dispatch('getTimeSheet', friday);
				//this.getTimeSheet(day);
			},
			invertColors: function () {
				store.commit('invertColors');
			},
			refresher: function () {
				if (utilities.authenticator.hasToken()) {
				//	this.timeWorked = this.calculateTimeWorked(this.timeIntervals.intervals);

					this.prepareClockData(this.timeIntervals, this.twentyFourHourDonut);
				}
			}
		}
	});
})();