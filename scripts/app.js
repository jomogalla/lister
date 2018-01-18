(function () {
	'use strict';


	var app = new Vue({
		el: '#app',
		data: {
			// General
			token: null,
			hasToken: false,
			timeWorked: moment.duration(0, 'minutes'),
			fogbugzLinkUrl: '',

			// Controls
			currentPerson: {},
			currentCaseId: null,
			caseActive: false,

			currentViewedCaseId: null,
			currentCase: {},

			// Search
			searchQuery: '',
			searchResults: {},

			// Timesheet
			dayToShow: moment(),
			//displayDate: moment().format("YYYY-MM-DD"),
			timeIntervals: {},

			// Routes
			listView: true,
			caseView: false,
			searchView: false,
			payPeriodView: false,
			metricsView: false,

			// Pay Period
			workdays: 0,
			payPeriodIntervals: {},
			payPeriodTotal: moment.duration(0, 'minutes'),
			payPeriodStartDate: null,
			payPeriodEndDate: null,

			// Metrics
			metricsTitle: "",
			metricsTotalHours: 0,

			// Login
			username: '',
			password: '',
			subdomain: '',

			// Donuts - Remove from data 
			eightHourDonut: null,
			twentyFourHourDonut: null,
		},
		watch: {
			timeWorked: function (newTimeWorked) {
				var minutesWorked = Math.floor(newTimeWorked.asMinutes());
				this.eightHourDonut.updateEight(minutesWorked);
			}
		},
		mounted: function () {
			// Private properties
			this.$_bar = new utilities.bar('#metrics-chart', constants.weeklyBarChartData, constants.weeklyBarChartOptions);
			this.$_currentMetricDate = moment();
			
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
				this.fogbugzLinkUrl = constants.httpsUrlPrefix + utilities.authenticator.getSubDomain() + constants.externalLinkSuffix;

				// Setup tokens
				this.token = utilities.authenticator.getToken();
				this.hasToken = true;

				// Get our timesheet
				this.getTimeSheet(this.dayToShow);

				// Make Eight Hour Donut
				this.eightHourDonut = new utilities.donut('#chartone', constants.eightHourDonutData, constants.eightHourDonutOptions);

				//Make 24 hour donut
				this.twentyFourHourDonut = new utilities.donut('#chartclock', constants.twentyFourHourDonutData, constants.twentyFourHourDonutOptions);

				// Load the current user 
				this.getPerson();

				// Refresh the charts every second
				setInterval(function () { self.refresher() }, 60000);
			},
			addToken: function () {
				// Todo - pass in this token, not have it in vue
				if (this.token) {
					utilities.authenticator.addToken(this.token);
					utilities.authenticator.addSubDomain(this.subdomain)
					this.hasToken = true;

					this.initializeApp();
				}
			},
			logon: function () {
				utilities.authenticator.logon(this.username, this.password);
			},
			downloadCSV: function (args) {
				var data, filename, link;
				var csv = utilities.convertArrayOfObjectsToCSV({
					data: this.formatTimeIntervalsForCSV(this.payPeriodIntervals)
				});
				if (csv == null) return;

				// filename = args.filename || 'export.csv';
				var fullname = this.currentPerson.sFullName.replace(' ', '');
				var startDate = this.payPeriodStartDate.format('MMMMD');
				var endDate = this.payPeriodEndDate.format('D');


				filename = fullname + startDate + '-' + endDate + '.csv';

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
			updateIntervalWithInterval: function (interval) {


			},
			formatTimeIntervalsForCSV: function (timeIntervals) {
				var formattedIntervals = [];

				// TODO - Get the project for each case???
				for (var i = 0; i < timeIntervals.length; i++) {
					formattedIntervals.push({
						'Start': moment(timeIntervals[i].dtStart).format('M/D/YYYY H:mm'),
						'End': moment(timeIntervals[i].dtEnd).format('M/D/YYYY H:mm'),
						'Duration': this.getDuration(timeIntervals[i].dtStart, timeIntervals[i].dtEnd).asMinutes(),
						'Project': '',
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

				if (this.timeIntervals.intervals.length === 0) {
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
			sumDurations: function (intervals) {
				// This method assumes that the intervals array objects have durations
				var sum = moment.duration(0, 'minutes');

				for (var i = 0; i < intervals.length; i++) {
					if (intervals[i].duration) {
						sum = sum.add(intervals[i].duration);
					}
				}

				return sum;
			},
			addDurations: function (intervals) {
				for (var i = 0; i < intervals.length; i++) {
					intervals[i].duration = this.getDuration(intervals[i].dtStart, intervals[i].dtEnd);
				}

				return intervals;
			},
			getDuration: function (start, end) {
				if (start && end) {
					var startMoment = moment(start);
					var endMoment = moment(end);
				} else if (start && !end) {
					// Use the current time as end if we dont have one
					var startMoment = moment(start);
					var endMoment = moment();
				} else {
					return moment.duration(0, 'minutes');
				}

				return moment.duration(endMoment.diff(startMoment));
			},
			calculateTimeWorked: function (intervals, donut) {
				//This is for The 8 Hour Clock
				var timeWorked = moment.duration(0);
				if (!intervals) {
					return 0;
				}

				for (var i = 0; i < intervals.length; i++) {
					var startMoment = moment(intervals[i].dtStart)
					if (intervals[i].dtEnd) {
						var endMoment = moment(intervals[i].dtEnd)
					} else {
						var endMoment = moment();
						this.setActiveCase(intervals[i].ixBug);
					}


					var duration = moment.duration(endMoment.diff(startMoment));

					timeWorked = timeWorked.add(duration);
				}

				return timeWorked;
			},

			getWorkdaysForPeriod: function (startDay, endDay) {
				var days = 0;
				var tempDay = moment(startDay);

				while (tempDay.isBefore(endDay)) {
					if (tempDay.day() !== 0 && tempDay.day() !== 6) {
						days++;
					}
					tempDay.add(1, 'days');
				}

				return days;
			},

			/////////    HTTP Methods     /////////
			setActiveCase: function (ixBug) {
				this.currentCaseId = ixBug;
			},
			search: function () {
				var search = {
					"cmd": "search",
					"token": utilities.authenticator.getToken(),
					"q": this.searchQuery,
					"max": 5,
					"cols": ["sTitle", "sStatus"]
				};

				utilities.loader.start();
				utilities.api(search).then(this.handleSearchRequest);
			},
			handleSearchRequest: function (response) {
				this.searchResults = typeof response === 'object' ? response.data : JSON.parse(response).data;
				utilities.loader.stop();
			},

			startWork: function (caseId) {
				var startWork = {
					"cmd": "startWork",
					"token": utilities.authenticator.getToken(),
					"ixBug": caseId
				};

				utilities.loader.start();
				utilities.api(startWork).then(this.handleStartWorkRequest);

				this.currentCaseId = caseId;
			},
			handleStartWorkRequest: function () {
				this.getPerson();
				this.getTimeSheet(this.dayToShow);
			},
			getActiveCase: function () {

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
				this.getPerson();
				this.getTimeSheet(this.dayToShow);
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

				this.getTimeSheet(this.dayToShow);

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
				this.getTimeSheet(this.dayToShow);
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
			getTimeSheet: function (date) {
				// Set DayToShow
				this.dayToShow = moment(date);

				var startTime = moment(date).startOf('day');
				var endTime = moment(date).endOf('day');

				var listIntervalsForDate = {
					"cmd": "listIntervals",
					"token": utilities.authenticator.getToken(),
					"dtStart": startTime.toJSON(),
					"dtEnd": endTime.toJSON()
				};

				utilities.loader.start();
				utilities.api(listIntervalsForDate).then(this.handleTimeSheetRequest);
			},
			handleTimeSheetRequest: function (response) {
				this.timeIntervals = typeof response === 'object' ? response.data : JSON.parse(response).data;
				utilities.loader.stop();

				this.timeWorked = this.calculateTimeWorked(this.timeIntervals.intervals);

				this.prepareClockData(this.timeIntervals.intervals, this.twentyFourHourDonut);
			},
			getPayPeriod: function (dayInPayPeriod) {
				if (dayInPayPeriod.date() <= 15) {
					var startTime = new moment(dayInPayPeriod).startOf('month');
					var endTime = new moment(dayInPayPeriod).date(15).endOf('day');
				} else {
					var startTime = new moment(dayInPayPeriod).date(16).startOf('day');
					var endTime = new moment(dayInPayPeriod).endOf('month');
				}

				this.workdays = this.getWorkdaysForPeriod(startTime, endTime);

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
				this.payPeriodIntervals = this.addDurations(this.payPeriodIntervals);
				this.payPeriodTotal = this.sumDurations(this.payPeriodIntervals);
				utilities.loader.stop();
			},

			getPerson: function () {
				var viewPerson = {
					"cmd": "viewPerson",
					"token": utilities.authenticator.getToken()
				};

				utilities.loader.start();
				utilities.api(viewPerson).then(this.handlePersonRequest);
			},
			handlePersonRequest: function (response) {
				this.currentPerson = typeof response === 'object' ? response.data.person : JSON.parse(response).data.person;
				utilities.loader.stop();
			},

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

					//Convert intervals to moment ranges
					var rangeIntervals = _.map(intervals,
						function (val) {
							var endDate = (val.dtEnd) ? val.dtEnd : moment(); //if the end time is empty the case is currently being worked, so use current time

							return {
								range: moment.range(val.dtStart, endDate),
								interval: val
							};
						});

					//Build time worked Per Day
					var timeWorkedPerDay = _
					.chain(_.range(0, 7, 0))
					.map(function (val, i) {

						var dayStart = startTime.clone().add(i, "days");
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

					var hoursPerDayArray = _.map(timeWorkedPerDay, function (val) {
						return (val.minutesWorked / 60).toFixed(2);
					});

					vm.metricsTotalHours = _.sumBy(hoursPerDayArray, function(val) {
						return parseFloat(val);
					}).toFixed(2);

					vm.$_bar.updateData(hoursPerDayArray);
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
				this.listView = true;
				this.caseView = false;
				this.searchView = false;
				this.payPeriodView = false;
				this.metricsView = false;
			},
			showSearch: function () {
				this.listView = false;
				this.caseView = false;
				this.searchView = true;
				this.payPeriodView = false;
				this.metricsView = false;
			},
			showCase: function (caseNumber) {
				this.listView = false;
				this.caseView = true;
				this.searchView = false;
				this.payPeriodView = false;
				this.metricsView = false;

				// TODO add logic to only get this if the case has changed or is null
				this.getCaseByNumber(caseNumber);

			},
			showPayPeriod: function () {
				this.listView = false;
				this.caseView = false;
				this.searchView = false;
				this.payPeriodView = true;
				this.metricsView = false;

				// TODO add conditional logic to only get this if the pay period has changed or is null
				this.getPayPeriod(this.dayToShow);
			},
			toggleMetrics: function () {

				if (this.metricsView) {
					this.showList();
					return;
				}


				this.listView = false;
				this.caseView = false;
				this.searchView = false;
				this.payPeriodView = false;
				this.metricsView = true;

				//initialize metrics data
				this.getMetrics(moment());
			},


			showPreviousDay: function () {
				this.getTimeSheet(this.dayToShow.subtract(1, 'days'));
			},
			showNextDay: function () {
				this.getTimeSheet(this.dayToShow.add(1, 'days'));
			},
			skipToMonday: function () {
				this.getTimeSheet(this.dayToShow.add(3, 'days'));
			},
			skipToFriday: function () {
				this.getTimeSheet(this.dayToShow.subtract(3, 'days'));
			},
			showToday: function () {
				var today = new moment();

				if (!today.isSame(this.dayToShow, 'day')) {
					this.showDay();
				}
			},
			showDay: function (day) {
				day = new moment(day);
				this.getTimeSheet(day);
			},
			refresher: function () {
				if (utilities.authenticator.hasToken()) {
					this.timeWorked = this.calculateTimeWorked(this.timeIntervals.intervals);

					this.prepareClockData(this.timeIntervals.intervals, this.twentyFourHourDonut);
				}
			}
		}
	});
})();