var utilities = utilities || {};
utilities.router = {
    routes: {
        //takes a date?
        'timesheet': {
            'name': 'Timesheet',
            'url': '/time',
        },
        //Takes a case number
        'case': {
            'name': 'Case',
            'url': '/case'
        },
        // takes a search parameter
        'search': {
            'name': 'Search',
            'url': '/search'
        },
        // takes a Month and 1 or 2
        'report': {
            'name': 'Report',
            'url': '/report',

        },
        // takes nothing
        'logon': {
            'name': 'logon',
            'url': '/logon'
        },
        'default': {
            name: 'timesheet'
        }
    },
    state: {
        title: '',
        parameters: {},
        
    },
    initializeState: function () {

    },
    go: function (route, parameters) {

        this.state = {}
        if (!this.routes[route]) {
            console.error('Unable to locate route: ', route);
            return;
        }

        window.history.pushState(this.state, this.routes[route].name, (this.routes[route].url))
    },
    pushState: function () { },
    getState: function () { }
};