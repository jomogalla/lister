// TODO
// After user inputs a crappy date, use moment to update the view to show what will actually b submitted
Vue.component('add-interval', {
	props: [
		'value',
		'currentdate'
	],
	data() {
		return {
			bug: null,
			start: null,
			end: null,
			caseInvalid: false,			//Maybe move this validation data to computed
			startInvalid: false,
			endInvalid: false,
			showingAddForm: true,
			showingRemoveForm: false
		};
	},
	computed: {
		displayValue() {
			if(this.value) {
				return moment(this.value).format('hh:mma');	
			} else {
				return "";
			}
		}
	},
	methods: {
		addInterval() {
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

		clearTime() {
			var timeFormat = 'h:mma';

			// Validate Inputs
			this.caseInvalid = false;
			this.startInvalid = false;
			this.endInvalid = false;

			var startMoment = moment(this.start, timeFormat);
			var endMoment = moment(this.end, timeFormat);

			if(!startMoment.isValid()) {
				this.startInvalid = true;
			}

			if(!endMoment.isValid()) {
				this.endInvalid = true;
			}

			if(this.startInvalid || this.endInvalid) {
				return;
			}

			// Change Moments to the day we are looking at
			this.setCorrectDates(startMoment);
			this.setCorrectDates(endMoment);

			this.$emit('cleartime', startMoment, endMoment);
		},

		setCorrectDates(date) {
			date.set('year', this.currentdate.year());
			date.set('month', this.currentdate.month());
			date.set('date', this.currentdate.date());
		},

		showAddForm() {
			this.showingAddForm = true;
			this.showingRemoveForm = false;
		},
		showRemoveForm() {
			this.showingAddForm = false;
			this.showingRemoveForm = true;
		},
		hideForms() {
			//Clear out stuff
			this.start = null;
			this.end = null;
			this.bug = null;
			this.caseInvalid = false;
			this.startInvalid = false;
			this.endInvalid = false;

			this.showingAddForm = false;
			this.showingRemoveForm = false;
		}
	},
	template: '#add-interval-template',
});