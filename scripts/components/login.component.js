var mapState = Vuex.mapState;

Vue.component('login', {
	data() {
		return {
			username: '',
			password: '',
			token: '',
			subdomain: ''
		};
	},
	computed: mapState({
		hasToken: state => state.hasToken,
	}),
	methods: {
		addToken() {
			var checkToken = {
				"cmd": "logon",
				"token": this.token,
			};

			utilities.authenticator.addSubDomain(this.subdomain)
			utilities.loader.start();
			utilities.api(checkToken).then(this.handleAddToken, (response) => { 
				this.$store.commit('handleErrorRequest', response)
			});

		},
		handleAddToken(response) {
			var token = response.data.token;

			if (token) {
				utilities.authenticator.addToken(token);
				
				this.$store.commit('setToken', token);

				this.$emit('initialize');
			}
		},
		logon() {	// NOT SUPPORTED
			utilities.authenticator.logon(this.username, this.password);
		},
	},
	template: '#login-template',
});