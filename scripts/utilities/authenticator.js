var utilities = utilities || {};
utilities.authenticator = {
    token: '',
    subDomain: '',
    logon: function (email, password) {
        var self = this;
        var logonObject = {
            "cmd": "logon",
            "email": email,
            "password": password
        };

        utilities.api(logonObject).then(function (response) {
            var parsedResponse = JSON.parse(response)
            if (!parsedResponse.errorCode) {
                self.addToken(parsedResponse.data.token);
                return true;
            } else {
                return false;
            }
        });
    },
    logoff: function (token) {

    },
    addToken: function (token) {
        this.token = token;
        utilities.storage.save('token', token);
        return this.token;
    },
    getToken: function () {
        if (!this.token) {
            this.token = utilities.storage.load('token');
        }

        return this.token;
    },
    clearToken: function() {
        utilities.storage.delete('token');
    },
    addSubDomain: function (subDomain) {
        if(!subDomain) { return; }

        this.subDomain = subDomain;
        utilities.storage.save('subDomain', subDomain);
    },
    getSubDomain: function () {
        if (!this.subDomain) {
            this.subDomain = utilities.storage.load('subDomain');
        }	

        return this.subDomain ? this.subDomain : '';
    },
    hasToken: function () {
        return !(!utilities.storage.load('token') && !this.token);
    }
};