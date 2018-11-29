var mapState = Vuex.mapState;

Vue.component('settings', {
	computed: mapState({
		settingsView: state => state.ui.settingsView,
		stylesInverted: state => state.ui.stylesInverted
	}),
	methods: {
		clearToken: function () {
			utilities.authenticator.clearToken();
			window.location.reload();
		},
		invertColors: function () {
			store.commit('invertColors');
		}
	},
	template: '#settings-template'
});