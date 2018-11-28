const timeModule = {
	state: {
		dayToShow: moment(),
		intervals: {}
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

			return timeWorked;
		}
	},
	mutations: {
		updateDayToShow(state, date) {
			state.dayToShow = date;
		},
		updateTimeIntervals(state, timeIntervals) {
			state.intervals = timeIntervals;
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
			//this.dayToShow = moment(date);
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
	

				//context.timeWorked = this.calculateTimeWorked(this.timeIntervals.intervals);
	
				//this.prepareClockData(this.timeIntervals.intervals, this.twentyFourHourDonut);
			});
		}
	}
}