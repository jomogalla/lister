// TODO - Update this to add notifications to the current notification list, clearing after a certain time, and not adding weird html in the message...


var utilities = utilities || {};
utilities.notifier =  {
    addMessage: function(message) {
        var notifier = document.getElementById('notifier');

        // Adding the button here is gross... Fix it
        notifier.innerHTML =  message + ' <i class="fa fa-times-circle" onclick="utilities.notifier.clearMessage()"></i>';
        notifier.parentElement.style.display = 'block';
    },
    clearMessage: function(messageId) {
        var notifier = document.getElementById('notifier');
        notifier.innerHTML =  '';
        notifier.parentElement.style.display = 'none';
    }
};

