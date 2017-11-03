var utilities = utilities || {};
utilities.storage = {
    save: function(key, value) {
        localStorage.setItem(key, value);

    },
    load: function (key) {
        return localStorage.getItem(key);
    },
    delete: function(key) {
        localStorage.removeItem(key);
    },
    clearAllStorage: function() {
        for (var key in localStorage) {
            console.log(localStorage[key]);
        }
    }
};