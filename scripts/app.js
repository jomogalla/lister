(function () {
	'use strict';

	// TODO: ACTUALLY IMPORT
	var mapState = Vuex.mapState;

	var app = new Vue({
		el: '#app',
		store,
		computed: mapState({
			hasToken: state => state.hasToken,
			dayToShow: state => state.time.dayToShow
		}),
		watch: {
			timeWorked: function (newTimeWorked) {
				
			}
		},
		mounted() {
			this.$store.commit('initializeUI');

			// If we have a token, load it up
			if (utilities.authenticator.hasToken()) {
				this.initializeApp();
			}
		},
		methods: {
			initializeApp() {
				// Setup tokens
				store.commit('setToken', true);

				// Get our timesheet
				this.$store.dispatch('getTimeSheet', this.dayToShow)

				// Load the current user 
				store.dispatch('getPerson');

				// Load Starred Cases
				store.dispatch('getStarredCases');

				// Refresh the charts every second
				setInterval(() => { this.refresher() }, constants.refreshUIInterval );
			},
			refresher() {
				if (this.hasToken) {
					// Need to update getters on store
				//	this.timeWorked = this.calculateTimeWorked(this.timeIntervals.intervals);
					this.$store.dispatch('refreshUI');
				}
			}
		}
	});
})();
