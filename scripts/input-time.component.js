// First Draft input-time. needs updates & to be configurable

// TODO 
// Figure out how not to pass interval and dtstart (watching change on the parent or something?)

Vue.component('input-time', {
	template: '<input type=text ref="input" class="date-picker hidden-input" v-bind:value="displayValue" v-on:change="updateTimePicked($event.target.value)">',
	props: [
		'value',
		'intervalid',
		'isdtstart'
	],
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
		updateTimePicked: function (newValue) {
			var timeSplit = newValue.match(/[a-zA-Z]+|[0-9]+/g);

			var twentyFourHourOffset = timeSplit[2] === 'pm' ? 12 : 0;
			// Turn 12am into 00
			if(timeSplit[2] === 'am' && timeSplit[0] == 12) {
				var hour = 0;
			} else {
				var hour = parseInt(timeSplit[0]) + twentyFourHourOffset;
			}

			
			var minute = parseInt(timeSplit[1]);

			if(hour > 24 || minute > 59) { return; }
	
			var formattedValue = moment(this.value);
			formattedValue.set({'hour': hour, 'minute': minute});

			// If the value was not already normalized,
			// manually override it to conform
			if (formattedValue.format('hh:mma') !== newValue) {
				this.$refs.input.value = formattedValue.toISOString()
			}

			// Emit the number value through the input event
			this.$emit('input', String(formattedValue.toISOString()))

			if(this.isdtstart) {
				this.$emit('intervalchanged', this.intervalid, formattedValue.toISOString(), null);
			} else {
				this.$emit('intervalchanged', this.intervalid, null, formattedValue.toISOString());
			}

		}
	}
});