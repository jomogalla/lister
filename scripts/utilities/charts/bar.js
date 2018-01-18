var utilities = utilities || {};
utilities.bar = function (id, data, options, updateFunction) {
	var ctx = $(id);
	
	this.chart = new Chart(ctx, {
		type: 'bar',
		data: data,
		options: options
	});

	this.updateData = function(data) {
		this.chart.data.datasets[0].data = data;
		this.chart.update();
	};

	this.clear = function () {
		this.chart.data.datasets[0].data = [];
		this.chart.update();
	};
};