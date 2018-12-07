var mapState = Vuex.mapState;

Vue.component('starred-cases', {
	computed: mapState({
		starredCasesView: state => state.ui.starredCasesView,
		starredCases: state => state.case.starredCases,
		fogbugzLinkUrl() { return utilities.authenticator.getFogBugzLinkUrl(); }
	}),
	methods: {
		showCase(caseNumber) {
			this.$store.dispatch('getAndShowCase', caseNumber);
		},
	},
	template: '#starred-cases-template',
});