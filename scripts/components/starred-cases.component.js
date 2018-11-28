var mapState = Vuex.mapState;

Vue.component('starred-cases', {
	template: '#starred-cases-template',
	data: function() {
		return {

		};
	},
	computed: mapState({
		starredCasesView: state => state.ui.starredCasesView,
		starredCases: state => state.case.starredCases,
		fogbugzLinkUrl() {
			return utilities.authenticator.getFogBugzLinkUrl();
		}
	}),
	methods: {
		showCase: function (caseNumber) {
			store.dispatch('getAndShowCase', caseNumber);
		},
	}
});