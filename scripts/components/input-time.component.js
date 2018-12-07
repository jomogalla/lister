// TODO 
// Figure out how not to pass interval and dtstart (watching change on the parent or something?)

Vue.component('input-time', {
	props: [
		'value',
		'intervalid',
		'isdtstart'
	],
	computed: {
		displayValue: function () {
			if(this.value) {
				return moment(this.value).format('h:mma');	
			} else {
				return "";
			}
		}
	},
	methods: {
		updateTimePicked: function (newValue) {
			var timeFormat = 'h:mma';
			var formattedValue = moment(newValue, timeFormat);
			var currentValue = moment(this.value);

			formattedValue.set('year', currentValue.year());
			formattedValue.set('month', currentValue.month());
			formattedValue.set('date', currentValue.date());

			// Emit the number value through the input event
			this.$emit('input', String(formattedValue.toISOString()))

			if(this.isdtstart) {
				this.$emit('intervalchanged', this.intervalid, formattedValue.toISOString(), null);
			} else {
				this.$emit('intervalchanged', this.intervalid, null, formattedValue.toISOString());
			}
		}
	},
	template: '<input type=text ref="input" class="date-picker hidden-input" v-bind:value="displayValue" v-on:change="updateTimePicked($event.target.value)">',
});