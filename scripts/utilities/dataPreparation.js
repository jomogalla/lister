var utilities = utilities || {};
utilities.dataPreparation = {
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
    getDuration: function (start, end) {
        if (start && end) {
            var startMoment = moment(start);
            var endMoment = moment(end);
        } else if (start && !end) {
            // Use the current time as end if we dont have one
            var startMoment = moment(start);
            var endMoment = moment();
        } else {
            return moment.duration(0, 'minutes');
        }

        return moment.duration(endMoment.diff(startMoment));
    },
    addDurations: function (intervals) {
        for (var i = 0; i < intervals.length; i++) {
            intervals[i].duration = utilities.dataPreparation.getDuration(intervals[i].dtStart, intervals[i].dtEnd);
        }

        return intervals;
    },
    sumDurations: function (intervals) {
        // This method assumes that the intervals array objects have durations
        var sum = moment.duration(0, 'minutes');

        for (var i = 0; i < intervals.length; i++) {
            if (intervals[i].duration) {
                sum = sum.add(intervals[i].duration);
            }
        }

        return sum;
    },
    getWorkdaysForPeriod: function (startDay, endDay) {
        var days = 0;
        var tempDay = moment(startDay);

        while (tempDay.isBefore(endDay)) {
            if (tempDay.day() !== 0 && tempDay.day() !== 6) {
                days++;
            }
            tempDay.add(1, 'days');
        }

        return days;
    },
};