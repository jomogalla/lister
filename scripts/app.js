(function () {
	'use strict';


	var app = new Vue({
		el: '#app',
		data: {
			username: '',
			password: '',
			token: null,
			hasToken: false,
			searchQuery: '',
			searchResults: {},
			timeIntervals: {},
			fogbugzLinkUrl: constants.fogbugzExternalLinkUrl,
			listView: true,
			caseView: false,
			searchView: false,
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
			console.log(this.eightHourDonut);

			//Make 24 hour donut
			this.twentyFourHourDonut = new utilities.donut('#chartclock', this.twentyFourHourDonutData, this.twentyFourHourDonutOptions)

			// THIS DONT WORK
			utilities.router.initializeState();
			
			// Refresh the charts every second
			setInterval(function() {self.refresher()}, 60000);
		},
		methods: {
			addToken: function () {
				if (this.token) {
					utilities.authenticator.addToken(this.token);
					this.hasToken = true;
					this.getTimeSheet(this.dayToShow);
				}
			},
			logon: function () {
				utilities.authenticator.logon(this.username, this.password);
			},
			/////////   Data Preparation Methods   /////////
			prepareClockData: function () {
				// This is for the 8 Hour clock.
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
			calculateTimeWorked: function () {
				//This is for The 24 Hour Clock
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
					}


					var duration = moment.duration(endMoment.diff(startMoment));

					this.timeWorked = this.timeWorked.add(duration);

				}

				this.minutesWorked = Math.floor(this.timeWorked.asMinutes());


				this.eightHourDonut.updateEight(this.minutesWorked);
			},
			/////////    HTTP Methods     /////////
			setActiveCase: function (caseId) {
				var bugcase = {

				};

				// utilities.loader.start();
				// utilities.api(bugcase).then(this.setCase);
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

			startWork: function (bug) {
				var startWork = {
					"cmd": "startWork",
					"token": utilities.authenticator.getToken(),
					"ixBug": this.searchQuery
				};

				// utilities.loader.start('loading...');
				// utilities.api(startWork).then(this.handleResponse);
			},
			getCaseByNumber: function (caseNumber) {
				var getCase = {
					"cmd": "search",
					"token": "BF2LHHGG025K2K1V5A0AG2SJDG9VO7",
					"q": caseNumber,
					"max": 1,
					"cols": ["ixBug", "ixBugParent", "sTitle", "dblStoryPts","hrsElapsed", "sLatestTextSummary", "ixBugEventLatestText", "events"]
				};

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
				}

				utilities.loader.start();
				utilities.api(listIntervalsForDate).then(this.handleTimeSheetRequest);
			},
			handleTimeSheetRequest: function (response) {
				this.timeIntervals = $.parseJSON(response).data;
				utilities.loader.stop();
				this.calculateTimeWorked();
				this.prepareClockData();
			},

			/////////   UI Methods   /////////
			showList: function () {
				this.listView = true;
				this.caseView = false;
				this.searchView = false;
			},
			showSearch: function () {
				this.listView = false;
				this.caseView = false;
				this.searchView = true;
			},
			showCase: function (caseNumber) {
				this.listView = false;
				this.caseView = true;
				this.searchView = false;

				utilities.loader.start();
				this.currentCaseId = caseNumber;
				this.getCaseByNumber(caseNumber)
			},
			showPreviousDay: function () {
				this.getTimeSheet(this.dayToShow.subtract(1, 'days'));
			},
			showNextDay: function () {
				this.getTimeSheet(this.dayToShow.add(1, 'days'));
			},
			refresher: function () {
				this.calculateTimeWorked();
				this.prepareClockData();
			}
		}
	});
})();