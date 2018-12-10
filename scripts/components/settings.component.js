var mapState = Vuex.mapState;

Vue.component('settings', {
	computed: mapState({
		settingsView: state => state.ui.settingsView,
		stylesInverted: state => state.ui.stylesInverted
	}),
	methods: {
		clearToken() {
			utilities.authenticator.clearToken();
			window.location.reload();
		},
		invertColors() {
			this.$store.commit('invertColors');
		}
	},
	template: '#settings-template'
});