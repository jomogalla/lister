(function(){
var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!',
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
    token: ''
  },
  http: {

  },
  methods: {
    pingCraig: function () {
      // var body = {
      //       'cmd': 'logon',
      //       'username': this.username,
      //       'password': this.password
      //   };
      var search =  {
        "cmd": "search",
        "token": this.token,
        "q": this.query,
        "max": 2,
        "cols": ["sTitle", "sStatus"]
      };

      Vue.http.headers.common['Content-Type'] = 'text/plain';

      debugger;
      
        // this.$http.get(this.baseUrl + this.formatPrefix + this.format + this.queryPrefix + this.query + this.sortPrefix + this.sort)
        this.$http.post(this.fogbugzUrl, { body: search } )
        .then(function(resp){
            if(typeof resp.data == 'string') {
               resp.data = JSON.parse(resp.data);
            }
            this.posts=resp.data.data.children;
        });
    }

  }
})
})();
