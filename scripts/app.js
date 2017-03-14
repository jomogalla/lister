(function () {
	'use strict';


	var app = new Vue({
		el: '#app',
		data: {
			currentPerson: {},
			username: '',
			password: '',
			token: null,
			hasToken: false,
			searchQuery: '',
			searchResults: {},
			timeIntervals: {},
			payPeriodIntervals: {},
			fogbugzLinkUrl: constants.fogbugzExternalLinkUrl,
			listView: true,
			caseView: false,
			searchView: false,
			payPeriodView: false,
			payPeriodTotal: moment.duration(0, 'minutes'),
			payPeriodStartDate: null,
			payPeriodEndDate: null,
			caseActive: false,
			currentCase: {},
			currentCaseId: null,
			dayToShow: moment(),
			timeWorked: moment.duration(0, 'minutes'),
			minutesWorked: 0,
			eightHourDonut: null,
			eightHourDonutData: {labels:["Minutes Worked","Minutes Left"],datasets: [{data: [0, 480],backgroundColor:["#FF6384","#FFCE56","#36A2EB"],hoverBackgroundColor: ["#FF6384","#FFCE56","#36A2EB"]}]},
			eightHourDonutOptions: {type:'eight',legend:{display: false}},
			twentyFourHourDonut : null,
			twentyFourHourDonutData : {labels:["Minutes Worked","Minutes Left"],datasets:[{data: [0, constants.twentyFourHoursInMinutes],backgroundColor:["#F9F9F9"]}]},
			twentyFourHourDonutOptions : {type:'twentyFour',legend:{display:false}}
		},
		mounted: function () {
			var self = this;

			// Figure Out Token Situation
			if(utilities.authenticator.hasToken()){
				this.token = utilities.authenticator.getToken();
				this.addToken();
			}

			// Make Eight Hour Donut
			this.eightHourDonut = new utilities.donut('#chartone', this.eightHourDonutData, this.eightHourDonutOptions);

			//Make 24 hour donut
			this.twentyFourHourDonut = new utilities.donut('#chartclock', this.twentyFourHourDonutData, this.twentyFourHourDonutOptions)

			// THIS DONT WORK
			utilities.router.initializeState();

			this.getPerson();
			
			// Refresh the charts every second
			setInterval(function() {self.refresher()}, 60000);

			
		},
		methods: {
			addToken: function (yolo) {
				if (this.token) {
					utilities.authenticator.addToken(this.token);
					this.hasToken = true;
					this.getTimeSheet(this.dayToShow);
				}
			},
			logon: function (yolo) {
				utilities.authenticator.logon(this.username, this.password);
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
				// if (this.currentCaseId === caseNumber) {
				// 	return;
				// } 

				// this.currentCase = {};
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
					var startTime = new moment().date(1).startOf('day');
					var endTime = new moment().endOf('month');
				}

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

				// if(caseNumber !== this.CurrentCaseId) {
					//TODO - The Stop/play buttons are not using currentCaseId correctly. 
					// this.currentCaseId = caseNumber;
					this.getCaseByNumber(caseNumber);
				// }
				
			},
			showPayPeriod: function () {
				this.listView = false;
				this.caseView = false;
				this.searchView = false;
				this.payPeriodView = true;
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
				this.calculateTimeWorked();
				this.prepareClockData();
			}
		}
	});
})();