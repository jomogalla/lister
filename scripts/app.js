(function () {
	'use strict';

	// TODO: ACTUALLY IMPORT
	var mapState = Vuex.mapState;

	var app = new Vue({
		el: '#app',
		store,
		data: {
			eightHourDonut: null,
			twentyFourHourDonut: null,
		},
		computed: mapState({
			listView: state => state.ui.listView,
			caseView: state => state.ui.caseView,
			searchView: state => state.ui.searchView,
			payPeriodView: state => state.ui.payPeriodView,
			metricsView: state => state.ui.metricsView,
			settingsView: state => state.ui.settingsView,
			starredCasesView: state => state.ui.starredCasesView,
			stylesInverted: state => state.ui.stylesInverted,
			currentPerson: state => state.controls.currentPerson,
			currentCaseId: state => state.controls.currentCaseId,
			caseActive: state => state.controls.caseActive,
			token: state => state.token,
			hasToken: state => state.hasToken,
			dayToShow: state => state.time.dayToShow,
			timeIntervals: state => state.time.intervals,
			currentViewedCaseId: state => state.case.currentViewedCaseId,
			currentCase: state => state.case.currentCase,
			starredCases: state => state.case.starredCases,
			timeWorked() {
				return this.$store.getters.timeWorked;
			},
			fogbugzLinkUrl () {
				return utilities.authenticator.getFogBugzLinkUrl();
			}
		}),
		watch: {
			timeWorked: function (newTimeWorked) {
				var minutesWorked = Math.floor(newTimeWorked.asMinutes());
				this.eightHourDonut.updateEight(minutesWorked);
			},
			stylesInverted: function() {
				this.stylesInverted ? document.body.classList.add('invert') : document.body.classList.remove('invert');
			}
		},
		mounted: function () {
			// Private properties
			// Check for saved settings
			store.commit('initializeUI');

			// If we have a token, load her up
			if (utilities.authenticator.hasToken()) {
				this.initializeApp();
			}
		},
		methods: {
			initializeApp: function () {
				var self = this;

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
				setInterval(function () { self.refresher() }, 1000);
			},
			/////////   UI Methods   /////////
			invertColors: function () {
				store.commit('invertColors');
			},
			refresher: function () {
				if (utilities.authenticator.hasToken()) {
					// Need to update getters on store
				//	this.timeWorked = this.calculateTimeWorked(this.timeIntervals.intervals);

					this.twentyFourHourDonut.updateTwentyFour(this.timeIntervals);
				}
			}
		}
	});
})();
