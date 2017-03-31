(function () {
	'use strict';


	var app = new Vue({
		el: '#app',
		data: {
			workdays: 0,
			subdomain: '',
			username: '',
			password: '',
			token: null,
			hasToken: false,
			searchQuery: '',
			searchResults: {},
			timeIntervals: {},
			payPeriodIntervals: {},
			fogbugzLinkUrl: '',
			listView: true,
			caseView: false,
			searchView: false,
			payPeriodView: false,
			payPeriodTotal: moment.duration(0, 'minutes'),
			payPeriodStartDate: null,
			payPeriodEndDate: null,
			caseActive: false,
			currentCase: {},
			dayToShow: moment(),
			timeWorked: moment.duration(0, 'minutes'),
			minutesWorked: 0,
			eightHourDonut: null,
			twentyFourHourDonut : null,
			// Proposed state properties
			currentPerson: {},
			currentCaseId: null,
		},
		mounted: function () {
			// If we have a token, load her up
			if(utilities.authenticator.hasToken()){
				this.initializeApp();
			}
		},
		methods: {
			initializeApp: function () {
				var self = this;

				// Setup links - (not sure that this is better than having the link hardcoded....)
				this.subdomain = utilities.authenticator.getSubDomain();
				this.fogbugzLinkUrl = constants.httpsUrlPrefix + utilities.authenticator.getSubDomain() + constants.externalUrlSuffix;
			
				// Setup tokens
				this.token = utilities.authenticator.getToken();
				this.hasToken = true;

				// Get our timesheet
				this.getTimeSheet(this.dayToShow);

				// Make Eight Hour Donut
				this.eightHourDonut = new utilities.donut('#chartone', constants.eightHourDonutData, constants.eightHourDonutOptions);
				
				//Make 24 hour donut
				this.twentyFourHourDonut = new utilities.donut('#chartclock', constants.twentyFourHourDonutData, constants.twentyFourHourDonutOptions)

				// THIS DONT WORK
				utilities.router.initializeState();

				// Load the current user 
				this.getPerson();
				
				// Refresh the charts every second
				setInterval(function() {self.refresher()}, 60000);
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

			formatTimeIntervalsForCSV: function(timeIntervals) {
				var formattedIntervals = [];

				// TODO - Get the project for each case???
				for(var i = 0; i < timeIntervals.length; i++) {
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

			/////////   Data Preparation Methods   /////////
			prepareClockData: function () {
				// This is for the 24 Hour clock.
				// Should these take an input and simply return something? I think so. 
				// At the moment this uses Data from vue and updates donuts. All over the place;
				var clockInputData = this.timeIntervals.intervals;

				if (this.timeIntervals.intervals.length === 0) {
					this.twentyFourHourDonut.clear();
					this.twentyFourHourDonut.updateTwentyFour([]);
					return;
				}

				if (!clockInputData.length) {return;}
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
					if(!clockInputData[i].dtEnd) {
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
					'time': moment.duration(endOfDay.diff(betterClockData[betterClockData.length-1].end)).asMinutes(),
					'bug': ''
				});

				// Clean it... Remove 0 values and convert MS to Minutes
				var cleanedData = [];

				this.twentyFourHourDonut.clear();
				this.twentyFourHourDonut.updateTwentyFour(startOfTimeData);
			},
			sumDurations: function (intervals) {
				// This method assumes that the intervals array objects have durations
				var sum = moment.duration(0, 'minutes');

				for(var i = 0; i < intervals.length; i++) {
					if(intervals[i].duration) {
						sum = sum.add(intervals[i].duration);
					}
				}
							
				return sum;
			},
			addDurations: function(intervals) {
				for(var i = 0; i < intervals.length; i++) {
					intervals[i].duration = this.getDuration(intervals[i].dtStart, intervals[i].dtEnd);
				}

				return intervals;
			},
			getDuration: function(start, end) {
				if(start && end) {
					var startMoment = moment(start);
					var endMoment = moment(end);
				} else if(start && !end) {
					// Use the current time as end if we dont have one
					var startMoment = moment(start);
					var endMoment = moment();
				} else {
					return moment.duration(0, 'minutes');
				}

				return moment.duration(endMoment.diff(startMoment));
			},
			calculateTimeWorked: function () {
				//This is for The 8 Hour Clock
				this.timeWorked = moment.duration(0);
				if (!this.timeIntervals.intervals) {
					return;
				}

				for (var i = 0; i < this.timeIntervals.intervals.length; i++) {
					var startMoment = moment(this.timeIntervals.intervals[i].dtStart)
					if (this.timeIntervals.intervals[i].dtEnd) {
						var endMoment = moment(this.timeIntervals.intervals[i].dtEnd)
					} else {
						var endMoment = moment();
						this.setActiveCase(this.timeIntervals.intervals[i].ixBug);
					}


					var duration = moment.duration(endMoment.diff(startMoment));

					this.timeWorked = this.timeWorked.add(duration);
				}

				this.minutesWorked = Math.floor(this.timeWorked.asMinutes());

				this.eightHourDonut.updateEight(this.minutesWorked);
			},

			getWorkdaysForPeriod: function(startDay, endDay) {
				var days = 0;
				var tempDay = moment(startDay);

				while(tempDay.isBefore(endDay)) {
					if(tempDay.day() !== 0 && tempDay.day() !== 6) {
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
				this.searchResults = $.parseJSON(response).data;
				utilities.loader.stop();
			},

			startWork: function (bugNumber) {
				var startWork = {
					"cmd": "startWork",
					"token": utilities.authenticator.getToken(),
					"ixBug": bugNumber
				};

				utilities.loader.start('loading...');
				utilities.api(startWork).then(this.handleStartWorkRequest);

				//TODO - update these to have consistent naming
				this.currentCaseId = bugNumber;
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

				utilities.loader.start('loading...');
				utilities.api(stopWork).then(this.handleResponse);
			},
			handleResponse: function() {
				utilities.loader.stop();
				this.getPerson();
				this.getTimeSheet(this.dayToShow);
				this.setActiveCase();
			},
			getCaseByNumber: function (caseNumber) {
				var getCase = {
					"cmd": "search",
					"token": "BF2LHHGG025K2K1V5A0AG2SJDG9VO7",
					"q": caseNumber,
					"max": 1,
					"cols": ["ixBug", "ixBugParent", "sTitle", "dblStoryPts","hrsElapsed", "sLatestTextSummary", "ixBugEventLatestText", "events"]
				};

				utilities.loader.start();
				utilities.api(getCase).then(this.handleCaseRequest);
			},
			handleCaseRequest: function (response) {
				utilities.loader.stop();
				this.currentCase = $.parseJSON(response).data.cases[0];
			},

			getTimeSheet: function (date) {
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
				this.timeIntervals = $.parseJSON(response).data;
				utilities.loader.stop();
				this.calculateTimeWorked();
				this.prepareClockData();
			},
			getPayPeriod: function () {
				var currentDay = new moment();
				if (currentDay.date() <= 15) {
					var startTime = new moment().startOf('month');
					var endTime = new moment().date(15).endOf('day');
				} else {
					var startTime = new moment().date(16).startOf('day');
					var endTime = new moment().endOf('month');
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
				this.payPeriodIntervals = $.parseJSON(response).data.intervals;
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
				this.currentPerson = $.parseJSON(response).data.person;
				utilities.loader.stop();
			},
			

			/////////   UI Methods   /////////
			showList: function () {
				this.listView = true;
				this.caseView = false;
				this.searchView = false;
				this.payPeriodView = false;
			},
			showSearch: function () {
				this.listView = false;
				this.caseView = false;
				this.searchView = true;
				this.payPeriodView = false;
			},
			showCase: function (caseNumber) {
				this.listView = false;
				this.caseView = true;
				this.searchView = false;
				this.payPeriodView = false;

				// TODO add logic to only get this if the case has changed or is null
				this.getCaseByNumber(caseNumber);
				
			},
			showPayPeriod: function () {
				this.listView = false;
				this.caseView = false;
				this.searchView = false;
				this.payPeriodView = true;

				// TODO add conditional logic to only get this if the pay period has changed or is null
				this.getPayPeriod();
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
			refresher: function () {
				if(utilities.authenticator.hasToken()){
					this.calculateTimeWorked();
					this.prepareClockData();
				}
			}
		}
	});
})();