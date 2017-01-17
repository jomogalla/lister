(function(){


var app = new Vue({
  el: '#app',
  data: {
    query: '',
    results: [],
    baseUrl: 'https://portland.craigslist.org/search/sss=',
    queryPrefix: '&query=',
    formatPrefix: '?format=',
    format: 'rss',
    sortPrefix: '&sort=',
    sort: 'rel',
    fogbugzUrl: 'https://altsource.fogbugz.com/f/api/0/jsonapi',
    username: '',
    password: '',
    token: null,
    hasToken: false,
    searchQuery: '',
    searchResults: {},
    timeIntervals: {},
    fogbugzLinkUrl: 'https://altsource.fogbugz.com/f/cases/',
    listView: true,
    caseView: false,
    searchView: false,
    caseActive: false,
    currentCase: {},
    dayToShow: moment(),
    timeWorked: 0
  },
  http: {

  },
  methods: {
    addToken: function() {
      if(this.token) {
        utilities.authenticator.addToken(this.token)
        this.hasToken = true;
      }
    },
    setActiveCase: function(caseId) {
      var case = {

      };

      utilities.loader.start();
      utilites.api(case).then(this.setCase);
    },
    search: function() {
      var search =  {
        "cmd": "search",
        "token": utilities.authenticator.getToken(),
        "q": this.searchQuery,
        "max": 5,
        "cols": ["sTitle", "sStatus"]
      };

      utilities.loader.start();
      utilities.api(search).then(this.handleResponse);
    },
    startWork: function(bug) {
      var startWork = {
        "cmd": "startWork",
        "token": utilities.authenticator.getToken(),
        "ixBug": this.searchQuery
      };

      utilities.loader.start('loading...');
      utilities.api(startWork).then(this.handleResponse);
    },

    getTimeSheet: function(date) {
      var startTime = moment(date).startOf('day');
      var endTime = moment(date).endOf('day');

      var listIntervals = {
        "cmd": "listIntervals",
        "token": utilities.authenticator.getToken()
      };

      var listIntervalsForDate = {
        "cmd": "listIntervals",
        "token": utilities.authenticator.getToken(),
        "dtStart": startTime.toJSON(),
        "dtEnd": endTime.toJSON()
      }

      utilities.loader.start();
      utilities.api(listIntervalsForDate).then(this.handleResponse2);

    },
    showPreviousDay: function () {
      this.getTimeSheet(this.dayToShow.subtract(1, 'days'));
    },
    showNextDay: function () {
      this.getTimeSheet(this.dayToShow.add(1, 'days'));
    },
    calculateTimeWorked: function () {
      this.timeWorked = 0;
      if(!this.timeIntervals.intervals) {
        return;
      }
      debugger;
      // http://stackoverflow.com/questions/25150570/get-hours-difference-between-two-dates-in-moment-js
      for (var i = 0; i < this.timeIntervals.intervals.length; i ++) {
        console.log(this.timeIntervals.intervals[i]);
      }
    },
    handleResponse: function (response) {
      this.searchResults =  $.parseJSON(response).data;
      utilities.loader.stop();
    },
    handleResponse2: function (response) {
      this.timeIntervals =  $.parseJSON(response).data;
      utilities.loader.stop();
    },
    showList: function () {
      this.listView = true;
      this.caseView = false;
      this.searchView = false;
    },
    showSearch: function () {
      this.listView = false;
      this.caseView = false;
      this.searchView = true;
    },
    showCase: function () {
      this.listView = false;
      this.caseView = true;
      this.searchView = false;
    }
  }
});
Vue.filter('formatDate', function(value, format = 'MM/DD/YYYY hh:mm') {
  if (value) {
    return moment(String(value)).format(format)
  }
});
})();