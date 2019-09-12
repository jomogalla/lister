var mapState = Vuex.mapState;

Vue.component('controls', {
	computed: mapState({
		currentPerson: state => state.controls.currentPerson,
		hasToken: state => state.hasToken,
		timeWorked() { return this.$store.getters.timeWorked; },
		listView: state => state.ui.listView,
		caseView: state => state.ui.caseView,
		searchView: state => state.ui.searchView,
		payPeriodView: state => state.ui.payPeriodView,
		metricsView: state => state.ui.metricsView,
		settingsView: state => state.ui.settingsView,
	}),
	methods: {
		showList() {
			this.$store.commit('showList')
		},
		showSearch() {
			this.$store.commit('showSearch');
		},
		showCase(caseNumber) {
			this.$store.dispatch('getAndShowCase', caseNumber);
		},
		showPayPeriod() {
			this.$store.commit('showPayPeriod');
		},
		showSettings() {
			this.$store.commit('showSettings');
		},
		toggleMetrics() {
			this.$store.commit('showMetrics')
		},
		stopWork() {
			this.$store.dispatch('stopWork');
		}
	},
	template: '#controls-template'
});