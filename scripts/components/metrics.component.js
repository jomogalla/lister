var mapState = Vuex.mapState;

Vue.component('metrics', {
	data() {
		return {
			metricsTitle: "",
			startTime: "",
			endTime: "",
			metricsTotalHours: 0,
			metricsYtdHours: 0,
			metricsYtdDays: [],
			metricsDate: moment()
		};
	},
	computed: mapState({
		metricsView: state => state.ui.metricsView,
		ytdWeekAverage() {
			return (this.metricsYtdHours / moment(this.metricsDate).isoWeek()).toFixed(2);
		},
		ytdDailyAverage() {
			return (this.metricsYtdHours / this.metricsYtdDays.length).toFixed(2);
		},
		metricsInOneMonth() {
			return moment(this.endTime).isSame(this.startTime, 'month');
		}
	}),
	watch: {
		// If ever using a router, put this in navigation guards, or on mounted
		metricsView(val) {
			if(this.metricsView) {
				this.getMetrics(moment());
			}
		}
	},
	mounted() {
		this.$_bar = new utilities.bar('#metrics-chart', constants.weeklyBarChartData, constants.weeklyBarChartOptions);
	},
	methods: {
		getMetrics(targetDate) {
			this.metricsDate = targetDate.clone();
			
			var startYear = targetDate.clone().startOf('year');
			var startTime = targetDate.clone().startOf('week');
			var endTime = targetDate.clone().endOf('week');
			var dFormat = "M.DD";

			this.startTime = startTime;
			this.endTime = endTime;

			var listIntervalsForDate = {
				"cmd": "listIntervals",
				"token": utilities.authenticator.getToken(),
				"dtStart": startTime.toJSON(),
				"dtEnd": endTime.toJSON()
			};
			var listIntervalsForYtd = {
				"cmd": "listIntervals",
				"token": utilities.authenticator.getToken(),
				"dtStart": startYear.toJSON(),
				"dtEnd": endTime.toJSON()
			};

			var vm = this;
			utilities.loader.start();
			utilities.api(listIntervalsForDate).then(function (response) {
				var intervals = typeof response === 'object' ? response.data.intervals : JSON.parse(response).data.intervals;
				utilities.loader.stop();

				var intervalData = utilities.chartHelper.getProcessedData(intervals, startTime, endTime);
				vm.metricsTotalHours = intervalData.totalHours;

				vm.$_bar.updateData(intervalData.hoursPerDay);
			});
				
			utilities.loader.start();
			utilities.api(listIntervalsForYtd).then(function (response) {
				var ytdIntervals = typeof response === 'object' ? response.data.intervals : JSON.parse(response).data.intervals;
				utilities.loader.stop();

				var intervalData = utilities.chartHelper.getProcessedData(ytdIntervals, startYear, endTime);
				vm.metricsYtdHours = intervalData.totalHours;
				vm.metricsYtdDays = intervalData.hoursPerDay.filter(function (day) {
					if(day === "0.00") {
						return false;
					}
					return true;
				});
			});
		},
		goToPreviousWeekMetrics() {
			var targetDate = this.metricsDate.clone().subtract(1, "w");
			this.getMetrics(targetDate);
		},
		goToNextWeekMetrics() {
			var targetDate = this.metricsDate.clone().add(1, "w");
			this.getMetrics(targetDate);
		},
	},
	template: '#metrics-template',
});