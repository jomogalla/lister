const timeModule = {
	state: {
		dayToShow: moment(),
		intervals: {},
		getterTripper: false
	},
	getters: {
		timeWorked(state) {
			var timeWorked = moment.duration(0);
			if (!state.intervals) {
				return timeWorked;
			}

			for (var i = 0; i < state.intervals.length; i++) {
				var startMoment = moment(state.intervals[i].dtStart)
				if (state.intervals[i].dtEnd) {
					var endMoment = moment(state.intervals[i].dtEnd)
				} else {
					var endMoment = moment();
					//this.setActiveCase(state.intervals[i].ixBug);
					store.commit('setCurrentCaseId', state.intervals[i].ixBug);
				}


				var duration = moment.duration(endMoment.diff(startMoment));

				timeWorked = timeWorked.add(duration);
			}

			// This is here to force an update of the getter.
			// We need timeworked to be updated every ~minute
			// The underlying data does not change, but the result does
			// Because the data remains the same, this getter never updates
			// Other options would be a mutation that updates a timeWorked state that could be called
			state.getterTripper = state.getterTripper;

			return timeWorked;
		}
	},
	mutations: {
		updateDayToShow(state, date) {
			state.dayToShow = date;
		},
		updateTimeIntervals(state, timeIntervals) {
			state.intervals = timeIntervals;
		},
		triggerRefreshForTimeWorked(state) {
			// Might not be the best design decision
			// Flipping this boolean will force an update of the getters its in
			state.getterTripper = !state.getterTripper;
		}
	},
	actions: {
		startWork(context, caseId) {
			var startWork = {
				"cmd": "startWork",
				"token": utilities.authenticator.getToken(),
				"ixBug": caseId
			};

			utilities.loader.start();
			utilities.api(startWork).then(function() {
				context.dispatch('getPerson');
				context.dispatch('getTimeSheet', this.dayToShow)
			});

			context.commit('setCurrentCaseId', caseId);
		},
		stopWork(context) {
			var stopWork = {
				"cmd": "stopWork",
				"token": utilities.authenticator.getToken()
			};

			utilities.loader.start();
			utilities.api(stopWork).then(function() {
				utilities.loader.stop();
				context.dispatch('getPerson');
				
				context.dispatch('getTimeSheet', this.dayToShow)
				store.commit('setCurrentCaseId');
			});
		},
		getTimeSheet: function (context, date) {
			// Set DayToShow
			context.commit('updateDayToShow', moment(date));

			var startTime = moment(date).startOf('day');
			var endTime = moment(date).endOf('day');

			var listIntervalsForDate = {
				"cmd": "listIntervals",
				"token": utilities.authenticator.getToken(),
				"dtStart": startTime.toJSON(),
				"dtEnd": endTime.toJSON()
			};

			utilities.loader.start();
			utilities.api(listIntervalsForDate).then(function(response) {
				var responseObject = typeof response === 'object' ? response.data : JSON.parse(response).data;
				store.commit('updateTimeIntervals', responseObject.intervals)
				utilities.loader.stop();
			});
		}
	}
}