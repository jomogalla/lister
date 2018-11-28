'use strict';

Vue.use(Vuex);

const store = new Vuex.Store({
	modules: {
		ui: uiModule,
		controls: controlsModule,
		time: timeModule,
		case: caseModule
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

