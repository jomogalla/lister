var mapState = Vuex.mapState;

Vue.component('login', {
	template: '#login-template',
	props: [

	],
	data: function() {
		return {
			username: '',
			password: '',
			token: '',
			subdomain: ''
		};
	},
	computed: mapState({
	//	token: state => state.token,
		hasToken: state => state.hasToken,
	}),
	methods: {
		addToken: function () {
			var checkToken = {
				"cmd": "logon",
				"token": this.token,
			};

			utilities.authenticator.addSubDomain(this.subdomain)
			utilities.loader.start();
			utilities.api(checkToken).then(this.handleAddToken, function(response) { store.commit('handleErrorRequest', response)} );

		},
		handleAddToken: function (response) {
			var token = response.data.token;

			if (token) {
				utilities.authenticator.addToken(token);
				
				store.commit('setToken', token);
				//this.hasToken = true;

				// THIS IS BROKEN
				this.initializeApp();
			}
		},
		logon: function () {	// NOT SUPPORTED
			utilities.authenticator.logon(this.username, this.password);
		},
	}
});