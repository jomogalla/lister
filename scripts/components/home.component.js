var mapState = Vuex.mapState;

Vue.component('home', {
	template: '#home-template',
	data: function() {
		return {
		};
	},
	computed: mapState({
	//	token: state => state.token,
		hasToken: state => state.hasToken,
		caseView: state => state.ui.caseView,
		listView: state => state.ui.listView,
		dayToShow: state => state.time.dayToShow,
		currentViewedCaseId: state => state.case.currentViewedCaseId,
		currentCase: state => state.case.currentCase,
		currentCaseId: state => state.controls.currentCaseId,
		timeIntervals: state => state.time.intervals,
		starredCasesView: state => state.ui.starredCasesView,
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
		showPreviousDay: function () {
			let previousDay = this.dayToShow.subtract(1, 'days');
			this.$store.dispatch('getTimeSheet', previousDay)
		},
		showNextDay: function () {
			let nextDay = this.dayToShow.add(1, 'days');
			this.$store.dispatch('getTimeSheet', nextDay)
		},
		skipToMonday: function () {
			let monday = this.dayToShow.add(3, 'days');
			this.$store.dispatch('getTimeSheet', monday)
		},
		skipToFriday: function () {
			let friday = this.dayToShow.subtract(3, 'days');
			this.$store.dispatch('getTimeSheet', friday);
		},
		showToday: function () {
			var today = new moment();

			if (!today.isSame(this.dayToShow, 'day')) {
				this.showDay();
			}
		},
		showDay: function (day) {
			let momentDay = new moment(day);

			this.$store.dispatch('getTimeSheet', momentDay);
		},
		showStarredCases: function () {
			store.commit('showStarredCases');
		},
		hideStarredCases: function () {
			store.commit('hideStarredCases');
		},
		// Clear time works by adding time to a case, then deleting the interval we just created.
		clearTime: function(dtStart, dtEnd) {
			if(dtStart._isAMomentObject) {
				dtStart = dtStart.toISOString();	
			}

			if(dtEnd._isAMomentObject) {
				dtEnd = dtEnd.toISOString();	
			}

			var addInterval = {
				"cmd": "newInterval",
				"token": utilities.authenticator.getToken(),
				"ixBug": constants.deleteCaseId,
				"dtStart": dtStart,
				"dtEnd": dtEnd
			};
			utilities.loader.start();
			utilities.api(addInterval).then(this.handleClearTimeRequest);
		},
		handleClearTimeRequest: function(response) {
			this.deleteInterval(response.data.interval.ixInterval)
		},
		deleteInterval: function (timeIntervalId) {
			var deleteInterval = {
				"cmd": "deleteInterval",
				"ixInterval": timeIntervalId,
				"token": utilities.authenticator.getToken()
			};

			utilities.loader.start();
			utilities.api(deleteInterval).then(this.handleDeleteInterval, this.handleErrorRequest);
		},
		handleDeleteInterval: function (response) {
			utilities.loader.stop();

			this.$store.dispatch('getTimeSheet', this.dayToShow)
		},
		editInterval: function (ixInterval, dtStart, dtEnd) {
			var editInterval = {
				"cmd": "editInterval",
				"token": utilities.authenticator.getToken(),
				"ixInterval": ixInterval
			}
			if (dtStart) {
				editInterval.dtStart = dtStart;
			}

			if (dtEnd) {
				editInterval.dtEnd = dtEnd;
			}

			utilities.loader.start();
			utilities.api(editInterval).then(this.handleEditIntervalRequest, this.handleErrorRequest);
		},
		handleEditIntervalRequest: function (response) {
			utilities.loader.stop();
			this.$store.dispatch('getTimeSheet', this.dayToShow)
		},
		addInterval: function (ixBug, dtStart, dtEnd) {
			if(dtStart._isAMomentObject) {
				dtStart = dtStart.toISOString();	
			}

			if(dtEnd._isAMomentObject) {
				dtEnd = dtEnd.toISOString();	
			}

			var addInterval = {
				"cmd": "newInterval",
				"token": utilities.authenticator.getToken(),
				"ixBug": ixBug,
				"dtStart": dtStart,
				"dtEnd": dtEnd
			}

			utilities.loader.start();
			utilities.api(addInterval).then(this.handleAddIntervalRequest, this.handleErrorRequest);
		},
		handleAddIntervalRequest: function(response) {
			utilities.loader.stop();
			this.$store.dispatch('getTimeSheet', this.dayToShow)
		},
		resetCurrentCaseId: function () {
			if (this.currentCase.ixBug !== this.currentViewedCaseId) {
				this.currentViewedCaseId = this.currentCase.ixBug;
			}
		},
		updateCaseById: function (event) {
			let caseId = event.target.value;

			if (!caseId || caseId === this.currentCase.ixBug) { return; }

			store.dispatch('getAndShowCase', caseId);
		},
		startWork: function (caseId) {
			this.$store.dispatch('startWork', caseId);
		},
		stopWork: function () { 
			this.$store.dispatch('stopWork');
		}
	}
});