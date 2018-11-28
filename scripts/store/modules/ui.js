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
    },
    actions: {
        getAndShowCase: function (context, caseNumber) {
            context.commit('showCase', caseNumber);
            context.dispatch('getCaseByNumber', caseNumber);
		},
    }
}