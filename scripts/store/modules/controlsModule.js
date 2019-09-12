const controlsModule = {			//Rename this module plz
	state: {
		currentPerson: {},
		currentCaseId: null,
		caseActive: false,	// I kinda dont think this is used......
	},
	mutations: {
		setPerson(state, person) {
			state.currentPerson = person;
		},
		setCurrentCaseId(state, caseId) {
			state.currentCaseId = caseId;
		}
	},
	actions: {
		getPerson(context) {
			var viewPerson = {
				"cmd": "viewPerson",
				"token": utilities.authenticator.getToken()
			};

			utilities.loader.start();
			utilities.api(viewPerson).then(function(response) {
				utilities.loader.stop();
				var currentPerson = typeof response === 'object' ? response.data.person : JSON.parse(response).data.person;
				context.commit('setPerson', currentPerson);
			});
		}
	}
}