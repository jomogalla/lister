function constants () {
    this.fogbugzUrl = 'https://altsource.fogbugz.com/f/api/0/jsonapi';
    this.type = 'POST';
    this.contentType = 'text/plain';
    this.token = '';
}

// constants.prototype.url = function(){
//     return this._fogbugzUrl;
// }

// constants.prototype.contentType = function() {
//     return this._contentType;
// }

// constants.prototype.type = function() {
//     return this._type;
// }

// constants.prototype.getToken = function() {
//     return this._token;
// }

// constants.prototype.setToken = function(token) {
//     this._token = token;
// }

var utilities = {
    api: function (requestObject) {
        return $.ajax({
            url: 'https://altsource.fogbugz.com/f/api/0/jsonapi',
            type: 'POST',
            data: JSON.stringify(requestObject),
            contentType: 'text/plain',
        })
    },
    authenticator: {
        logon: function (username, password) {

        },
        logoff: function (token) {

        },
        addToken: function (token) {
            constants.token = token;
            return constants.token;
        },
        getToken: function () {
            return constants.token;
        }
    },
    loader: {
        start: function(message) {
            if(message) {
                $('#loader').text(message);
            } else {
                 $('#loader').html('<i class="fa fa-cog fa-spin fa-fw"></i>');
            }
            $('#loader').fadeIn();

        },
        stop: function() {
             $('#loader').fadeOut();
        }
    }
}