'use strict';

Vue.use(Vuex);

const store = new Vuex.Store({
	modules: {
		ui: uiModule,
		controls: controlsModule,
		time: timeModule,
		case: caseModule
	},
	state: {
		token: null,
		hasToken: false
	},
	mutations: {
		setToken(state, token) {
			state.token = token
			state.hasToken = true;
		},
		handleErrorRequest(state, response) {
			var errors = response.responseJSON.errors;

			for(var i = 0; i < errors.length; i++) {
				utilities.notifier.addMessage(errors[i].message);
			}
			
			utilities.loader.stop();
		}
	}
})

