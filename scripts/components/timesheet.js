Vue.component('timesheet', {
    template: '#timesheet-template',
    mounted: function () {
        this.getTimeSheet(this.dayToShow);
    },
    props: [
        // 'dayToShow' 
        'currentCaseId',
        'fogbugzLinkUrl'
    ],
    data: function () {
        return {
            dayToShow: moment(),
            timeIntervals: {}
        }
    },
    methods: {
        getTimeSheet: function (date) {
            var startTime = moment(date).startOf('day');
            var endTime = moment(date).endOf('day');

            var listIntervalsForDate = {
                "cmd": "listIntervals",
                "token": utilities.authenticator.getToken(),
                "dtStart": startTime.toJSON(),
                "dtEnd": endTime.toJSON()
            };

            utilities.loader.start();
            utilities.api(listIntervalsForDate).then(this.handleTimeSheetRequest);
        },
        handleTimeSheetRequest: function (response) {
            this.timeIntervals = typeof response === 'object' ? response.data : JSON.parse(response).data
            utilities.loader.stop();
            this.calculateTimeWorked();
            this.prepareClockData();
        },
        showPreviousDay: function () {
            this.getTimeSheet(this.dayToShow.subtract(1, 'days'));
        },
        showNextDay: function () {
            this.getTimeSheet(this.dayToShow.add(1, 'days'));
        },
        skipToMonday: function () {
            this.getTimeSheet(this.dayToShow.add(3, 'days'));
        },
        skipToFriday: function () {
            this.getTimeSheet(this.dayToShow.subtract(3, 'days'));
        },
    }
})