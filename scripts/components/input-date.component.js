// First Draft input-date. needs updates & to be configurable

Vue.component('input-date', {
	props: [
		'datestuff'
	],
	data() {
		return {
			pikaday: null,
			dayPicked: null
		}
	},
	watch: {
		datestuff: function (date) {
			this.updateDayPicked(date);
			this.pikaday.gotoDate(moment(date));
		}
	},
	mounted() {
		var self = this;

		this.dayPicked = moment(this.datestuff);

		var pikadayConfig = {
			field: document.getElementById('date-picker'),
			format: 'dddd MM.DD',
			onSelect() {
				self.dateSelected(this.getMoment());
			}
		};

		this.pikaday = new Pikaday (pikadayConfig);
	},
	methods: {
		dateSelected(currentDate) {
			this.updateDayPicked(currentDate);
			this.$emit('datepicked', currentDate);
		},
		updateDayPicked(day) {
			this.dayPicked = moment(day).format('dddd MM.DD');
		}
	},
	template: '<input type="text" class="date-picker hidden-input" v-model="dayPicked" id="date-picker">',
});