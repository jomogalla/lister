// TODO
// After user inputs a crappy date, use moment to update the view to show what will actually b submitted

Vue.component('add-interval', {
	template: '#add-interval-template',
	props: [
		'value',
		'currentdate'
	],
	data: function() {
		return {
			bug: null,
			start: null,
			end: null,
			caseInvalid: false,			//Maybe move this validation data to computed
			startInvalid: false,
			endInvalid: false,
			showForm: false
		};
	},
	computed: {
		displayValue: function () {
			if(this.value) {
				return moment(this.value).format('hh:mma');	
			} else {
				return "";
			}
		}
	},
	methods: {
		addInterval: function () {
			var timeFormat = 'h:mma';

			// Validate Inputs
			this.caseInvalid = false;
			this.startInvalid = false;
			this.endInvalid = false;

			if(!this.bug) {
				this.caseInvalid = true;
			}

			var startMoment = moment(this.start, timeFormat);
			var endMoment = moment(this.end, timeFormat);

			if(!startMoment.isValid()) {
				this.startInvalid = true;
			}

			if(!endMoment.isValid()) {
				this.endInvalid = true;
			}

			if(this.caseInvalid || this.startInvalid || this.endInvalid) {
				return;
			}

			// Change Moments to the day we are looking at

			this.setCorrectDates(startMoment);
			this.setCorrectDates(endMoment);

			this.$emit('addinterval', this.bug, startMoment, endMoment);
		},

		setCorrectDates: function(date) {
			date.set('year', this.currentdate.year());
			date.set('month', this.currentdate.month());
			date.set('date', this.currentdate.date());
		},

		showAddForm: function() {
			this.showForm = true;
		},
		hideAddForm: function() {
			this.showForm = false;
		}
	}
});