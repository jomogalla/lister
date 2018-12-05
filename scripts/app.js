(function () {
	'use strict';

	// TODO: ACTUALLY IMPORT
	var mapState = Vuex.mapState;

	var app = new Vue({
		el: '#app',
		store,
		data() { 
			return {
				eightHourDonut: null,
				twentyFourHourDonut: null,
			}
		},
		computed: mapState({
			hasToken: state => state.hasToken,
			dayToShow: state => state.time.dayToShow,
			timeIntervals: state => state.time.intervals,
			timeWorked() { return this.$store.getters.timeWorked }
		}),
		watch: {
			timeWorked: function (newTimeWorked) {
				var minutesWorked = Math.floor(newTimeWorked.asMinutes());
				this.eightHourDonut.updateEight(minutesWorked);
			}
		},
		mounted: function () {
			store.commit('initializeUI');

			// If we have a token, load it up
			if (utilities.authenticator.hasToken()) {
				this.initializeApp();
			}
		},
		methods: {
			initializeApp: function () {
				// Setup tokens
				store.commit('setToken', true);

				// Get our timesheet
				this.$store.dispatch('getTimeSheet', this.dayToShow)

				// Make Eight Hour Donut
				this.eightHourDonut = new utilities.donut('#chartone', constants.eightHourDonutData, constants.eightHourDonutOptions);

				//Make 24 hour donut
				this.twentyFourHourDonut = new utilities.donut('#chartclock', constants.twentyFourHourDonutData, constants.twentyFourHourDonutOptions);

				// Load the current user 
				store.dispatch('getPerson');

				// Load Starred Cases
				store.dispatch('getStarredCases');

				// Refresh the charts every second
				setInterval(() => { this.refresher() }, constants.refreshUIInterval);
			},
			refresher: function () {
				if (this.hasToken) {
					// Need to update getters on store
				//	this.timeWorked = this.calculateTimeWorked(this.timeIntervals.intervals);
					this.$store.commit('triggerRefreshForTimeWorked');

					this.twentyFourHourDonut.updateTwentyFour(this.timeIntervals);
				}
			}
		}
	});
})();
