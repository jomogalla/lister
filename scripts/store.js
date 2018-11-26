'use strict';

Vue.use(Vuex);

const uiModule = {
	state: {
		// Views
		listView: true,
		caseView: false,
		searchView: false,
		payPeriodView: false,
		metricsView: false,
		settingsView: false,
		starredCasesView: true,
		// Misc UI Stuff
		stylesInverted: null
	},
	mutations: {
		initializeUI: function(state) {
			state.stylesInverted = JSON.parse(utilities.storage.load('stylesInverted'));
		},
		showList: function (state) {
			state.listView = true;
			state.caseView = false;
			state.searchView = false;
			state.payPeriodView = false;
			state.metricsView = false;
			state.settingsView = false;
		},
		showSearch: function (state) {
			state.listView = false;
			state.caseView = false;
			state.searchView = true;
			state.payPeriodView = false;
			state.metricsView = false;
			state.settingsView = false;
		},
		showCase: function (state, caseNumber) {
			state.listView = false;
			state.caseView = true;
			state.searchView = false;
			state.payPeriodView = false;
			state.metricsView = false;
			state.starredCasesView = false;
			state.settingsView = false;
		},
		showPayPeriod: function (state) {
			state.listView = false;
			state.caseView = false;
			state.searchView = false;
			state.payPeriodView = true;
			state.metricsView = false;
			state.settingsView = false;
		},
		showSettings: function (state) {
			if (state.settingsView) {
				store.commit('showList');
				return;
			}

			state.listView = false;
			state.caseView = false;
			state.searchView = false;
			state.payPeriodView = false;
			state.metricsView = false;
			state.settingsView = true;
		},
		showStarredCases: function (state) {
			state.starredCasesView = true;
		},
		hideStarredCases: function (state) {
			state.starredCasesView = false;
		},
		showMetrics: function (state) {
			if (state.metricsView) {
				store.commit('showList');
				return;
			}

			state.listView = false;
			state.caseView = false;
			state.searchView = false;
			state.payPeriodView = false;
			state.metricsView = true;
		},
		invertColors: function(state) {
			state.stylesInverted = !state.stylesInverted;

			utilities.storage.save('stylesInverted', state.stylesInverted);
		}
	}
}

const controlsModule = {			//Rename this module plz
	state: {
		currentPerson: {},
		currentCaseId: null,
		caseActive: false,	// I kinda dont think this is used......
	},
	mutations: {
		setPerson(state, person) {
			state.currentPerson = person;
		},
		setCurrentCaseId(state, caseId) {
			state.currentCaseId = caseId;
		}
	},
	actions: {
		getPerson(context) {
			var viewPerson = {
				"cmd": "viewPerson",
				"token": utilities.authenticator.getToken()
			};

			utilities.loader.start();
			utilities.api(viewPerson).then(function(response) {
				var currentPerson = typeof response === 'object' ? response.data.person : JSON.parse(response).data.person;
				context.commit('setPerson', currentPerson);
			});
		}
	}
}

const timeModule = {			//Rename this module plz
	state: {
		dayToShow: moment(),
		timeIntervals: {},
		timeWorked
	},
	mutations: {
		updateDayToShow(state, date) {
			state.dayToShow = date;
		},
		updateTimeIntervals(state, timeIntervals) {
			state.timeIntervals = timeIntervals;
		}
	},
	actions: {
		getTimeSheet: function (context, date) {
			// Set DayToShow
			this.dayToShow = moment(date);
			context.commit('updateDayToShow', date)

			var startTime = moment(date).startOf('day');
			var endTime = moment(date).endOf('day');

			var listIntervalsForDate = {
				"cmd": "listIntervals",
				"token": utilities.authenticator.getToken(),
				"dtStart": startTime.toJSON(),
				"dtEnd": endTime.toJSON()
			};

			utilities.loader.start();
			utilities.api(listIntervalsForDate).then(function(response) {
				var timeIntervals = typeof response === 'object' ? response.data : JSON.parse(response).data;
				store.commit('updateTimeIntervals', timeIntervals)
				utilities.loader.stop();
	
				this.timeWorked = this.calculateTimeWorked(this.timeIntervals.intervals);
	
				this.prepareClockData(this.timeIntervals.intervals, this.twentyFourHourDonut);
			});
		}
	}
}

const store = new Vuex.Store({
	modules: {
		ui: uiModule,
		controls: controlsModule
	},
	state: {
		token: null,
		hasToken: false
	},
	mutations: {
		setToken(state, token) {
			state.token = token
			state.hasToken = true;
		},
		handleErrorRequest(state, response) {
			debugger;
			var errors = response.responseJSON.errors;

			for(var i = 0; i < errors.length; i++) {
				utilities.notifier.addMessage(errors[i].message);
			}
			
			utilities.loader.stop();
		}
	},
	actions: {
		initializeApp(context) {
			state.token = utilities.authenticator.getToken();

			var self = this;

			// Setup links - (not sure that this is better than having the link hardcoded....)
		//	this.fogbugzLinkUrl = constants.httpsUrlPrefix + utilities.authenticator.getSubDomain() + constants.externalLinkSuffix;

			// Setup tokens
		//	this.token = utilities.authenticator.getToken();
		//	this.hasToken = true;
			store.commit('setToken', true);

			// Get our timesheet
			this.getTimeSheet(this.dayToShow);

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
	}
})

