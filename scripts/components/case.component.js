var mapState = Vuex.mapState;

Vue.component('case', {
	template: '#case-template',
	data: function() {
		return {

		};
	},
	computed: mapState({
		currentCase: state => state.case.currentCase,
		currentCaseId: state => state.controls.currentCaseId,
		starredCasesView: state => state.ui.starredCasesView,
		fogbugzLinkUrl() {
			return utilities.authenticator.getFogBugzLinkUrl();
		}
	}),
	methods: {
		updateCaseById: function (caseId) {
			if (caseId === this.currentCase.ixBug) { return; }

			store.dispatch('getCaseByNumber', caseId);
		},
		startWork: function (caseId) {
			this.$store.dispatch('startWork', caseId);
		},
		stopWork: function () { 
			this.$store.dispatch('stopWork');
		}
	}
});