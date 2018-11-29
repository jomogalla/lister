var mapState = Vuex.mapState;

Vue.component('controls', {
	template: '#controls-template',
	computed: mapState({
		starredCasesView: state => state.ui.starredCasesView,
		currentPerson: state => state.controls.currentPerson,
		timeWorked() { return this.$store.getters.timeWorked; },
		hasToken: state => state.hasToken,
		listView: state => state.ui.listView,
		caseView: state => state.ui.caseView,
		searchView: state => state.ui.searchView,
		payPeriodView: state => state.ui.payPeriodView,
		metricsView: state => state.ui.metricsView,
		settingsView: state => state.ui.settingsView,
	}),
	methods: {
		showList() {
			store.commit('showList')
		},
		showSearch() {
			store.commit('showSearch');
		},
		showCase(caseNumber) {
			store.dispatch('getAndShowCase', caseNumber);
		},
		showPayPeriod() {
			store.commit('showPayPeriod');
		},
		showSettings() {
			store.commit('showSettings');
		},
		toggleMetrics() {
			store.commit('showMetrics')
		},
		stopWork() {
			this.$store.dispatch('stopWork');
		}
	}
});