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
    password: ''
  },
  methods: {
    pingCraig: function () {
      var body = {
            'cmd': 'logon',
            'username': this.username,
            'password': this.password
        };
      
        // this.$http.get(this.baseUrl + this.formatPrefix + this.format + this.queryPrefix + this.query + this.sortPrefix + this.sort)
        this.$http.post(this.fogbugzUrl )
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
