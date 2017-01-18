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
    timeWorked: moment.duration(0),
    minutesWorked: 0
  },
  mounted: function () {
    var donutData = {
      labels: [
          "Hours Worked",
          "Hours Left"
      ],
      datasets: [
          {
            data: [5, 3],
            backgroundColor: [
                "#FF6384",
                "#FFCE56"
            ],
            hoverBackgroundColor: [
                "#FF6384",
                "#FFCE56"
            ]
          }
      ]
    };
    var donutOptions = {
      legend: {
        display: false
      }
    };
    utilities.donut.initialize(donutData, donutOptions);
  },
  methods: {
    addToken: function() {
      if(this.token) {
        utilities.authenticator.addToken(this.token)
        this.hasToken = true;
        this.getTimeSheet(this.dayToShow);
      }

    },
    setActiveCase: function(caseId) {
      var bugcase = {

      };

      utilities.loader.start();
      utilites.api(bugcase).then(this.setCase);
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
      this.timeWorked = moment.duration(0);
      if(!this.timeIntervals.intervals) {
        return;
      }



      // http://stackoverflow.com/questions/25150570/get-hours-difference-between-two-dates-in-moment-js
      for (var i = 0; i < this.timeIntervals.intervals.length; i ++) {
        var startMoment = moment(this.timeIntervals.intervals[i].dtStart)
        if(this.timeIntervals.intervals[i].dtEnd) {
          var endMoment = moment(this.timeIntervals.intervals[i].dtEnd)
        } else {
          var endMoment = moment();
        }

  
        var duration = moment.duration(endMoment.diff(startMoment));

        this.timeWorked = this.timeWorked.add(duration);
        
      }

      this.minutesWorked = Math.floor(this.timeWorked.asMinutes());



      utilities.donut.update(this.minutesWorked);
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
    return moment(String(value)).format(format);
  }
});
Vue.filter('humanize', function(value) {
  return (moment.duration(value).hours() + ' hours ' + moment.duration(value).minutes() + ' minutes');
});
})();