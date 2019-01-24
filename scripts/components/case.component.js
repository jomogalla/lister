var mapState = Vuex.mapState;

Vue.component('case', {
	computed: mapState({
		currentCase: state => state.case.currentCase,
		currentCaseId: state => state.controls.currentCaseId,
		starredCasesView: state => state.ui.starredCasesView,
		fogbugzLinkUrl() { return utilities.authenticator.getFogBugzCasePrefix(); },
		currentCaseEvents() { return store.getters.currentCaseEventsFormatted }
	}),
	methods: {
		updateCaseById(caseId) {
			if (caseId === this.currentCase.ixBug) { return; }

			this.$store.dispatch('getCaseByNumber', caseId);
		},
		startWork(caseId) {
			this.$store.dispatch('startWork', caseId);
		},
		stopWork() { 
			this.$store.dispatch('stopWork');
		}
	},
	template: '#case-template',
}); 