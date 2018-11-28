const caseModule = {			//Rename this module plz
	state: {
		currentViewedCaseId: null,
		currentCase: {},
		starredCases: []
	},
	mutations: {
		setPerson(state, person) {
			state.currentPerson = person;
		},
		setCurrentViewedCaseId(state, caseId) {
			state.currentViewedCaseId = caseId;
		},
		setCurrentCase(state, currentCase) {
			state.currentCase = currentCase;
		},
		setStarredCases(state, cases) {
			state.starredCases = cases;
		}
	},
	actions: {
		getStarredCases(context) {
			var listCases = {
				"cmd": "listCases",
				"cols": ["ixBug","sTitle"],
				"token": utilities.authenticator.getToken(),
				"sFilter": constants.starredByFilterId
			};

			utilities.loader.start();
			utilities.api(listCases).then(function(response) {
				utilities.loader.stop();
				let cases = response.data.cases;
				context.commit('setStarredCases', cases);

			});
		},
		updateCurrentCase(context, caseId) {

		},
		getCaseByNumber(context, caseNumber) {
			if (caseNumber === context.state.currentCase.ixBug) { return; }

			context.commit('setCurrentViewedCaseId', caseNumber);

			var getCase = {
				"cmd": "search",
				"token": utilities.authenticator.getToken(),
				"q": caseNumber,
				"max": 1,
				"cols": ["ixBug", "ixBugParent", "sTitle", "dblStoryPts", "hrsElapsed", "sLatestTextSummary", "ixBugEventLatestText", "events"]
			};

			utilities.loader.start();
			utilities.api(getCase).then(function(response) {
				utilities.loader.stop();
				var responseObject = typeof response === 'object' ? response.data.cases[0] : JSON.parse(response).data.cases[0];
	


				// Check to make sure we have a case
				if (response.data.totalHits !== 0) {
					context.commit('setCurrentCase', responseObject);

					context.commit('setCurrentViewedCaseId', context.state.currentCase.ixBug);
				} else {
					let currentViewedCaseId = context.state.currentCase.ixBug || null;
					//this.currentViewedCaseId = this.currentCase.ixBug || null;
					context.commit('setCurrentViewedCaseId', currentViewedCaseId);
				}
			});
		}
	}
}