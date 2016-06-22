$(document).ready(drawChartForSelected);

window.addEventListener('hashchange', drawChartForSelected);

function drawChartForSelected() {
	var loc = location.hash.slice(1);
	if(loc == '') {
		loc = 'republican';
	}
	if(loc == "republican") {
		color = "red";
	}
	else {
		color = "blue";
	}
	chart("data/eu-questions-2013-2016.csv", 'blue');
}



function chart(csvpath, color) {
	var datearray = [];
	var colorrange = [];
	var siValue = "";
	var lastHoverPosition = null;
	var lastHoverQuestion = null;
	var Qs = [];

	var labels = {
		"What is the EU?": {
			color: '#fff',
			x: '44%',
			y: '48%',
			display: 'What is the EU',
			key: 'What_is_the_EU',
			cssClass: 'medium'
		},
	}

	// 1600  600

	colorrange = ["#5D2882", "#9A258E", "#9D0053", "#A786BF", "#DB9EC8", "#E770AA", "#ED135D", "#C858A2", "#B6015E", "#F6B6D0"];

	strokecolor = colorrange[0];

	var format = d3.time.format("%m/%d/%Y");

	var margin = {top: 20, right: 10, bottom: 30, left: 10};
	var width = document.body.clientWidth - margin.left - margin.right;

	var height = 600 - margin.top - margin.bottom;

	var tooltip = d3.select(".main-container")
		.append("div")
		.attr("class", "remove")
		.style("position", "absolute")
		.style("z-index", "20")
		.style("visibility", "hidden")
		.style("top", "30px")
		.style("left", "55px");

	var x = d3.time.scale()
		.range([0, width]);

	var y = d3.scale.linear()
		.range([height - 10, 001]);

	var z = d3.scale.ordinal()
		.range(colorrange);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.ticks(d3.time.months, 2)
		.tickFormat(d3.time.format("%b '%y"));

	var yAxis = d3.svg.axis()
		.scale(y);

	var stack = d3.layout.stack()
		.offset("silhouette")
		.values(function(d) { return d.values; })
		.x(function(d) { return d.date; })
		.y(function(d) { return d.value; });

	var nest = d3.nest()
		.key(function(d) { return d.key; });

	var area = d3.svg.area()
		.interpolate("cardinal")
		.x(function(d) { return x(d.date); })
		.y0(function(d) { return y(d.y0); })
		.y1(function(d) { return y(d.y0 + d.y); });

	$(".streamGraph").fadeOut(250, function() {
		var svg = d3.select(".streamGraph").html("").append("svg")
			.attr("width", '100%')
			.attr("height", '100%')
			.attr('viewBox','0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom))
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		$(".streamGraph").fadeIn(250);

		var graph = d3.csv(csvpath, function(loadedData) {
			var data = [], obj;
			for(var i = 0, len = loadedData.length; i < len; i++) {
				obj = loadedData[i];
				Object.keys(obj).forEach(function(key) {
					if(key !== 'Week') {
						data.push({
							date: obj.Week,
							key: key,
							value: obj[key]
						});
					}
				});
			}

			var row = loadedData[0];
			Object.keys(row).forEach(function(key, i) {
				if(key !== 'Week') {
					Qs.push(key);
					var id = key.replace(/\s/g, '_').replace('?', '');
					$("<div class='key' id='" + id + "'>" + key + "</div>")
						.appendTo('.key-container')
						.mouseover(function(e) {
							var tId = e.target.id;

							svg.selectAll(".layer").transition()
							.duration(250)
							.attr("opacity", function(d, j) {
								if(this.id == 'shape-' + tId) {
									return 1;
								}
								else {
									return 0.3;
								}
							});

							svg.selectAll('.labels').transition()
							.duration(250)
							.attr("opacity", function(d, j) {
								if(this.id == 'label-' + tId) {
									return 1;
								}
								else {
									return 0.3;
								}
							});
						})
						.mouseout(function(e) {
							svg.selectAll(".layer").transition()
							.duration(250)
							.attr("opacity", 1);
							svg.selectAll('.labels').transition()
							.duration(250)
							.attr("opacity", 1);
						});
					if(i !== Object.keys(row).length - 1) {
						$('.key-container').append('<span style="color:#999; margin-right: 20px;">&#9676;</span>');
					}
				}
			});

			data.forEach(function(d) {
				d.date = format.parse(d.date);
				d.value = +d.value;
			});

			var layers = stack(nest.entries(data));



			x.domain(d3.extent(data, function(d) { return d.date; }));
			y.domain([0, d3.max(data, function(d) { return d.y0 + d.y; })]);

			svg.selectAll(".layer")
				.data(layers)
				.enter().append("path")
				.attr("class", "layer")
				.attr("d", function(d) { return area(d.values); })
				.style("fill", function(d, i) { return z(i); });

			// Add Labels
			var displayAt = 4;
			var index = 0;
			svg.selectAll(".layerText")
				.data(layers).enter()
				.append('text')
				.attr('x', function(d, i) { return getLabel(d.key).x; })
				.attr('y', function(d) { return getLabel(d.key).y; })
				.attr('fill', function(d) { return getLabel(d.key).color; })
				.attr('class', function(d) { return 'labels ' + (getLabel(d.key).cssClass); })
				.attr('id', function(d) { 
					var id = 'label-' + d.key.replace(/\s/g, '_').replace('?', '');
					return id;
				})
				.text(function(d) {
					if(labels[d.key] !== undefined) {
						return getLabel(d.key).display;
					}
					return '';
				});

			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis);

			// Add annotations
			var annotationData = [
				//{date: '08/16/2015', title: 'Title' }
			];

			// Add annotations
			svg.selectAll("circle")
				.data(annotationData)
				.enter().append("svg:circle")
				.style("stroke", "white")
				.style("stroke-width","2")
				.style("fill", "#314159")
				.attr("r", 5)
				.attr("cx", function(d) { return x(new Date(d.date)) })
				.attr("cy", height / 6);

			$('svg circle').tipsy({ 
				gravity: $.fn.tipsy.autoWE, 
				html: true,
				fade: true,
				offset: 2, 
				title: function() {
					var d = this.__data__, title = d.title, date = d.date;
					return '<div class="annotation"><span class="title">' + d.title + '</span>' +
					' <br/><span class="date">' + date + '</span></div>'; 
				}
			});

			svg.selectAll(".layer")
				.attr("opacity", 1)
				.attr("id", function(d) {
					var id = 'shape-' + d.key.replace(/\s/g, '_').replace('?', '');
					return id;
				})
				.on("mouseover", function(d, i) {
					var id = d.key.replace(/\s/g, '_').replace('?', '');
					svg.selectAll(".layer").transition()
					.duration(250)
					.attr("opacity", function(d, j) {
						return j != i ? 0.3 : 1;
					});
					$('.key-container .key').each(function() {
						var lId = this.id;
						if(lId == id) {
							$(this).addClass('key-hover');
						}
						else {
							$(this).removeClass('key-hover');
						}
					});

					svg.selectAll('.labels').transition()
					.duration(250)
					.attr("opacity", function(d, j) {
						if(this.id == 'label-' + id) {
							return 1;
						}
						else {
							return 0.3;
						}
					});
				})

				.on("mousemove", function(d, i) {
					mousex = d3.mouse(this);
					mousex = mousex[0];
					var invertedx = x.invert(mousex);
					var tempDate = '' + (invertedx.getMonth() + 1) + '/' + invertedx.getDate() + '/' + invertedx.getFullYear();

					if(lastHoverPosition === tempDate && lastHoverQuestion === d.key) {
						return;
					}

					lastHoverPosition = tempDate;
					lastHoverQuestion = d.key;
				})
				
				.on("mouseout", function(d, i) {
					svg.selectAll(".layer")
					.transition()
					.duration(250)
					.attr("opacity", "1");
					d3.select(this)
					.classed("hover", false)
					$('.key-container .key').removeClass('key-hover');
					svg.selectAll('.labels').transition()
					.duration(250)
					.attr("opacity", 1);
				});
		});

		function getLabel(key) {
			if(labels[key] !== undefined) {
				return labels[key];
			}

			return {
				x: '',
				y: '',
				text: '',
				color: ''
			};
		}
	});
}