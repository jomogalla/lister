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

    getTimeSheet: function() {
      var listIntervals = {
        "cmd": "listIntervals",
        "token": utilities.authenticator.getToken()
      };

      utilities.loader.start();
      utilities.api(listIntervals).then(this.handleResponse2);

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