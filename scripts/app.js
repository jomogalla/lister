(function () {
	'use strict';


	var app = new Vue({
		el: '#app',
		data: {
			query: '',
			results: [],
			baseUrl: 'https://portland.craigslist.org/search/sss=',
			queryPrefix: '&query=',
			formatPrefix: '?format=',
			format: 'rss',
			sortPrefix: '&sort=',
			sort: 'rel',
			fogbugzUrl: 'https://altsource.fogbugz.com/f/api/0/jsonapi',
			username: '',
			password: '',
			token: null,
			hasToken: false,
			searchQuery: '',
			searchResults: {},
			timeIntervals: {},
			fogbugzLinkUrl: 'https://altsource.fogbugz.com/f/cases/',
			listView: true,
			caseView: false,
			searchView: false,
			caseActive: false,
			currentCase: {},
			currentCaseId: null,
			dayToShow: moment(),
			timeWorked: moment.duration(0, 'minutes'),
			minutesWorked: 0
		},
		mounted: function () {
			// MAking 2days timer
			var donutData = {
				labels: [
					"Minutes Worked",
					"Minutes Left"
				],
				datasets: [
					{
						data: [0, 480],
						backgroundColor: [
							"#FF6384",
							"#FFCE56",
							"#36A2EB"
						],
						hoverBackgroundColor: [
							"#FF6384",
							"#FFCE56",
							"#36A2EB"
						]
					}
				]
			};
			var donutOptions = {
				legend: {
					display: false
				}
			};
			utilities.donut.initialize(donutData, donutOptions);

			//donut clock initializing

			donutData = {
				labels: [
					"Minutes Worked",
					"Minutes Left"
				],
				datasets: [
					{
						data: [0, constants.twentyFourHoursInMinutes],
						backgroundColor: [
							"#FF6384",
							"#F9F9F9",
							"#36A2EB"
						],
						hoverBackgroundColor: [
							"#FF6384",
							"#FFCE56",
							"#36A2EB"
						]
					}
				]
			};
			donutOptions = {
				legend: {
					display: false
				}
			};

			utilities.donutClock.initialize(donutData, donutOptions)


			utilities.router.initializeState();
			var self = this;
			setInterval(function() {self.refresher()}, 60000);
		},
		methods: {
			addToken: function () {
				if (this.token) {
					utilities.authenticator.addToken(this.token)
					this.hasToken = true;
					this.getTimeSheet(this.dayToShow);
				}

			},
			logon: function () {
				utilities.authenticator.logon(this.username, this.password);
			},
			setActiveCase: function (caseId) {
				var bugcase = {

				};

				utilities.loader.start();
				utilites.api(bugcase).then(this.setCase);
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
				utilities.api(search).then(this.handleResponse);
			},
			startWork: function (bug) {
				var startWork = {
					"cmd": "startWork",
					"token": utilities.authenticator.getToken(),
					"ixBug": this.searchQuery
				};

				utilities.loader.start('loading...');
				utilities.api(startWork).then(this.handleResponse);
			},
			getCaseByNumber: function (caseNumber) {
				var getCase = {
					"cmd": "search",
					"token": "BF2LHHGG025K2K1V5A0AG2SJDG9VO7",
					"q": caseNumber,
					"max": 1,
					"cols": ["ixBug", "ixBugParent", "sTitle", "dblStoryPts","hrsElapsed", "sLatestTextSummary", "ixBugEventLatestText", "events"]
				};

				utilities.api(getCase).then(this.handleResponse3);
			},
			getTimeSheet: function (date) {
				var startTime = moment(date).startOf('day');
				var endTime = moment(date).endOf('day');

				var listIntervals = {
					"cmd": "listIntervals",
					"token": utilities.authenticator.getToken()
				};

				var listIntervalsForDate = {
					"cmd": "listIntervals",
					"token": utilities.authenticator.getToken(),
					"dtStart": startTime.toJSON(),
					"dtEnd": endTime.toJSON()
				}

				utilities.loader.start();
				utilities.api(listIntervalsForDate).then(this.handleResponse2);

			},
			prepareClockData: function () {
				var clockInputData = this.timeIntervals.intervals;

				if (this.timeIntervals.intervals.length === 0) {
					utilities.donutClock.clear();
					utilities.donutClock.update([]);
					// utilities.donutClock.clear();
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
				
				// for (var i = 0; i < startOfTimeData.length; i++) {
					
				// 	cleanedData.push(Math.floor(startOfTimeData[i].asMinutes()));
					
				// }
				utilities.donutClock.clear();
				utilities.donutClock.update(startOfTimeData);
			},
			showPreviousDay: function () {
				this.getTimeSheet(this.dayToShow.subtract(1, 'days'));
			},
			showNextDay: function () {
				this.getTimeSheet(this.dayToShow.add(1, 'days'));
			},
			calculateTimeWorked: function () {
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


				utilities.donut.update(this.minutesWorked);
			},
			handleResponse: function (response) {
				this.searchResults = $.parseJSON(response).data;
				utilities.loader.stop();
			},
			handleResponse2: function (response) {
				this.timeIntervals = $.parseJSON(response).data;
				utilities.loader.stop();
				this.calculateTimeWorked();
				this.prepareClockData();
			},
			handleResponse3: function (response) {
				utilities.loader.stop();
				this.currentCase = $.parseJSON(response).data.cases[0];
			},
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

				this.currentCaseId = caseNumber;
				this.getCaseByNumber(caseNumber)
			},
			refresher: function () {
				this.calculateTimeWorked();
				this.prepareClockData();
			}
		}
	});
})();