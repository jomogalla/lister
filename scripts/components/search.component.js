var mapState = Vuex.mapState;

Vue.component('search', {
	template: '#search-template',
	props: [

	],
	data: function() {
		return {
			searchQuery: '',
			searchResults: {}
		};
	},
	computed: mapState({
	//	token: state => state.token,
		hasToken: state => state.hasToken,
		searchView: state => state.ui.searchView,
		fogbugzLinkUrl() {
			return utilities.authenticator.getFogBugzLinkUrl();
		}
	}),
	methods: {
		search: function () {
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
		handleSearchRequest: function (response) {
			this.searchResults = typeof response === 'object' ? response.data : JSON.parse(response).data;
			utilities.loader.stop();
		},
		showCase: function (caseNumber) {
			store.dispatch('getAndShowCase', caseNumber);
		},
	}
});