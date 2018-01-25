var viewModule = {
    state: {
        list: true,
        case: false,
        search: false,
        payPeriod: false,
        metrics: false,
        starredCases: true,
    },
    mutations: {
        showList: function (state) {
            state.list = true;
            state.case = false;
            state.search = false;
            state.payPeriod = false;
            state.metrics = false;
        },
        showSearch: function (state) {
            state.list = false;
            state.case = false;
            state.search = true;
            state.payPeriod = false;
            state.metrics = false;
        },
        showCase: function (state, caseNumber) {
            state.list = false;
            state.case = true;
            state.search = false;
            state.payPeriod = false;
            state.metrics = false;
            state.starredCases = false;

            // TODO add logic to only get this if the case has changed or is null
            this.getCaseByNumber(caseNumber);

        },
        showPayPeriod: function (state) {
            this.list = false;
            this.case = false;
            this.search = false;
            this.payPeriod = true;
            this.metrics = false;

            // TODO add conditional logic to only get this if the pay period has changed or is null
            this.getPayPeriod(this.dayToShow);
        },
        showStarredCases: function (state) {
            state.starredCases = true;
        },
        hideStarredCases: function (state) {
            state.starredCases = false;
        },
        toggleMetrics: function (state) {
            if (state.metrics) {
                this.showList();
                return;
            }

            state.list = false;
            state.case = false;
            state.search = false;
            state.payPeriod = false;
            state.metrics = true;

            //initialize metrics data
            this.getMetrics(moment());
        },
    },
    actions: {},
    getters: {}
}