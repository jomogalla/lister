// Need to slim down what is using this, doesn't seem necessary a lot of the time.
const constants = {
	// HTTP
	httpsUrlPrefix: 'https://',
	apiUrlSuffix: '.fogbugz.com/f/api/0/jsonapi',
	externalLinkSuffix: '.fogbugz.com/f/cases/',
	requestType: 'POST',
	contentType: 'text/plain',
	// COLORS
	yellow: '#FFCE56',
	red: '#FF6384',
	blue: '#36A2EB',
	firstEight: [
		"#FF6384",
		"#FFCE56"
	],
	firstEightHover: [
		"#FF6384",
		"#FFCE56"
	],
	secondEight: [
		"#FF6384",
		"#36A2EB"
	],
	secondEightHover: [
		"#FFCE56",
		"#36A2EB"
	],

	// Other stuff
	deleteCaseId: 44073,
	starredByFilterId: 1572,

	// CHARTS
	eightHoursInMinutes: (60 * 8),
	twentyFourHoursInMinutes: (60 * 24),
	eightHourDonutData: {
		labels: [
			"Minutes Worked",
			"Minutes Left"
		],
		datasets: [
			{
				data: [0, 480],
				backgroundColor: ["#FF6384", "#FFCE56", "#36A2EB"],
				hoverBackgroundColor: ["#FF6384", "#FFCE56", "#36A2EB"]
			}
		]
	},
	eightHourDonutOptions: {
		type: 'eight',
		legend: {
			display: false
		}
	},
	twentyFourHourDonutData: {
		labels: [
			"Minutes Worked",
			"Minutes Left"
		],
		datasets: [
			{
				data: [0, this.twentyFourHoursInMinutes],
				backgroundColor: ["#F9F9F9"]
			}
		]
	},
	twentyFourHourDonutOptions: {
		type: 'twentyFour',
		legend: {
			display: false
		}
	},
	weeklyBarChartData: {
		labels: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
		datasets: [
			{
				label: "Hours",
				backgroundColor: Color("#36A2EB").alpha(0.5).rgbString(),
				borderColor: ["#36A2EB"],
				borderWidth: 1,
				data: []
			}
		]
	},
	weeklyBarChartOptions: {
		responsive: true,
		title: {
			display: false
		}
	}
};