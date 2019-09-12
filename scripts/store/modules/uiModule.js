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
		stylesInverted: JSON.parse(utilities.storage.load('stylesInverted')),
		eightHourDonut: null,
		twentyFourHourDonut: null,
	},
	mutations: {
		initializeUI: function(state) {
			store.commit('syncInvertedClasses');

			// Make Eight Hour Donut
			state.eightHourDonut = new utilities.donut('#chartone', constants.eightHourDonutData, constants.eightHourDonutOptions);

			//Make 24 hour donut
			state.twentyFourHourDonut = new utilities.donut('#chartclock', constants.twentyFourHourDonutData, constants.twentyFourHourDonutOptions);
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
			store.commit('syncInvertedClasses');

			utilities.storage.save('stylesInverted', state.stylesInverted);
		},
		syncInvertedClasses: function(state) {
			if(state.stylesInverted) { 
				document.body.classList.add('invert') 
			} else {
				document.body.classList.remove('invert');
			}
		}
		
    },
    actions: {
        getAndShowCase: function (context, caseNumber) {
			context.commit('setCurrentCase');
            context.commit('showCase', caseNumber);
            context.dispatch('getCaseByNumber', caseNumber);
		},
		refreshUI: function(context) {
			context.commit('triggerRefreshForTimeWorked');
			var minutesWorked = Math.floor(context.getters.timeWorked.asMinutes());
			context.state.eightHourDonut.updateEight(minutesWorked);

			context.state.twentyFourHourDonut.updateTwentyFour(context.rootState.time.intervals);
		}
    }
}