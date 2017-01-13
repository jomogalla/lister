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
    sort: 'rel'
  },
  methods: {
    pingCraig: function () {
        this.$http.get(this.baseUrl + this.formatPrefix + this.format + this.queryPrefix + this.query + this.sortPrefix + this.sort)
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
