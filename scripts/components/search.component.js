var mapState = Vuex.mapState;

Vue.component('search', {
	data() {
		return {
			searchQuery: '',
			searchResults: {}
		};
	},
	computed: mapState({
		hasToken: state => state.hasToken,
		searchView: state => state.ui.searchView,
		fogbugzLinkUrl() { return utilities.authenticator.getFogBugzLinkUrl(); }
	}),
	methods: {
		search() {
			var search = {
				"cmd": "search",
				"token": utilities.authenticator.getToken(),
				"q": this.searchQuery,
				"max": 50,
				"cols": ["sTitle", "sStatus"]
			};

			utilities.loader.start();
			utilities.api(search).then(this.handleSearchRequest);
		},
		handleSearchRequest(response) {
			this.searchResults = typeof response === 'object' ? response.data : JSON.parse(response).data;
			utilities.loader.stop();
		},
		showCase(caseNumber) {
			this.$store.dispatch('getAndShowCase', caseNumber);
		},
	},
	template: '#search-template',
});