var pgData;

d3.json("InvoiceJune2016.json", function (error, json) {
	if (error)
		return console.warn(error);
	pgData = json;
	visualise();
});

function visualise() {

	var scene = d3.select('a-scene');
	var nodeData = pgData.graph.nodes;
	var edgeData = pgData.graph.edges;

	var depth = false;
	var curve = false;

	let maxWidth = 1;
	let maxHeight = 2.5;
	let maxTheta = 30;
	let maxPhi = 90;
	let xSkew = 2;
	let ySkew = 1;
	let zshift = -0.02;
	let depthFactor = 0.3;
	let radius = 2;
	let animateScale = 1;
	let animateResolution = 1;

	var xScale = d3.scaleLinear()
		.domain(d3.extent(nodeData, function(d){return d.x}))
		.range([-maxWidth/2, maxWidth/2]);

	var yScale = d3.scaleLinear()
		.domain(d3.extent(nodeData, function(d){return d.y}))
		.range([maxHeight, 0.5]);

	var textScale = d3.scaleLinear()
		.domain(d3.extent(nodeData, function(d){return d.w}))
		.range([0.5, 0.8]);

	let xShift = xScale(pgData.graph.centralpoint.x);
	let yShift = yScale(pgData.graph.centralpoint.y);



	//console.log(xShift);

	var phiScale = d3.scaleLinear()
		.domain(d3.extent(nodeData, function(d){return d.x}))
		.range([-maxPhi/2,maxPhi/2]);

	var thetaScale = d3.scaleLinear()
		.domain(d3.extent(nodeData, function(d){return d.y}))
		.range([-maxTheta/2,maxTheta/2]);

	var invert = d3.scaleLinear()
		.domain([-100, 100])
		.range([0.2 * ySkew + yShift, -0.2 * ySkew + yShift]);	

	let phiShift = phiScale(pgData.graph.centralpoint.x);
	console.log(phiShift);
	let thetaShift = phiScale(pgData.graph.centralpoint.y);
	console.log(thetaShift);

	/* console.log('X extent is: ' + xmin + ' to ' + xmax + ': Y extent is ' + ymin + ' to ' + ymax);
	console.log('W extent is: ' + wmin + ' to ' + wmax + ': H extent is ' + hmin + ' to ' + hmax);
	console.log('W max scaled = ' + pureScale(wmax) + ' W min scaled is ' + pureScale(wmin));
 */
	//select all virtual nodes
	// using d3's enter/update/exit pattern to draw and bind dom elements
	scene.selectAll("#nodes")
	.data(nodeData)
	.enter()
	.append("a-entity")
	.attr('id', 'node')
	.attr('position', function (d) {
		//console.log(scale(d.x) + ' ' + invert(d.y) + ' 0');
		return xScale(d.x)-xShift + ' ' + yScale(d.y) + ' 0'
	})
	.attr('scale', function () {
		return animateScale + ' 1 1'
	})
	.attr('geometry', function (d) {
		//console.log(textScale(d.w));
		return 'primitive: plane; height: ' + 0.09 + ' ; width: ' + textScale(d.w)
	})
	.attr('material', 'shader: flat; color: white; side: double')
	.attr('text', function (d) {
		var textString = 'color: black; align: center; value: ' + d.name + '; width: auto';
		//console.log(textString);
		return textString
	})
	.on("click", function (d, i) {
		console.log("click", i, d)
	});

	//Create lines
	scene.selectAll("#lines")
	.data(edgeData)
	.enter()
	.append("a-entity")
	.attr('id', 'line')
	.attr("meshlinebezier", function (d) {
		var pathString = '';
		let cp = d.controlpoints;
		for (let i = 0; i < cp.length - 1; i++) {
			pathString += xScale(cp[i].x)-xShift + ' ' + yScale(cp[i].y) + ' ' + zshift + ', ';
		}
		pathString += xScale(cp[cp.length - 1].x)-xShift + ' ' + yScale(cp[cp.length - 1].y) + ' ' + zshift;
		//console.log(pathString);
		return 'lineWidth: 1; color: blue; radius: 2; curveFactor: 0.0; path: ' + pathString
	});

	//On click, alternate between states
	scene.on("click", function () {

		curve = !curve;

		//console.log('Depth is: ' + depth + '; Curve is: ' + curve);

		//Update all lines
		scene.selectAll("#line")
		.data(edgeData)
		.transition()
		.duration(animateResolution)
		.attrTween("meshlinebezier", function (d) {
			var old_data = this.components.meshlinebezier.data.path;
			//var old_position_string = old_data.x + ' ' + old_data.y + ' ' + old_data.z

			var deep_pathString = '';
			var flat_pathString = '';
			let cp = d.controlpoints;
			let cpl = cp.length - 1;
			let distance = Math.hypot(xScale(cp[0].x) - xScale(cp[cpl].x), yScale(cp[0].y) - yScale(cp[cpl].y));

			for (let i = 0; i < cp.length - 1; i++) {
				let dist2start = Math.hypot(xScale(cp[0].x) - xScale(cp[i].x), yScale(cp[0].y) - yScale(cp[i].y));
				let dist2end = Math.hypot(xScale(cp[cpl].x) - xScale(cp[i].x), yScale(cp[cpl].y) - yScale(cp[i].y));
				let z = ((distance - (dist2start + dist2end)) * depthFactor) + zshift;
				deep_pathString += xScale(cp[i].x)-xShift + ' ' + yScale(cp[i].y) + ' ' + z + ', ';
				flat_pathString += xScale(cp[i].x)-xShift + ' ' + yScale(cp[i].y) + ' ' + zshift + ', ';
			}
			deep_pathString += xScale(cp[cpl].x)-xShift + ' ' + yScale(cp[cpl].y) + ' ' + zshift;
			flat_pathString += xScale(cp[cpl].x)-xShift + ' ' + yScale(cp[cpl].y) + ' ' + zshift;

			var old_string = 'lineWidth: 1; color: blue; radius: 2; curveFactor: ';
			var new_string = 'lineWidth: 1; color: blue; radius: 2; curveFactor: ';
			if (curve) {
				old_string += 0.0 + '; path: ' + flat_pathString;
				new_string += 1.0 + '; path: ' + flat_pathString;
			} else {
				old_string += 1.0 + '; path: ' + flat_pathString;
				new_string += 0.0 + '; path: ' + flat_pathString;
			}
			//console.log('curve is ' + old_string + ' ' + new_string);
			return d3.interpolate(old_string, new_string)
		});

		//update all the nodes
		scene.selectAll("#node")
		.data(nodeData)
		.transition()
		.duration(1000)
		.attrTween('position', function (d) {
			//console.log(getZ(xScale(d.x), 2));
			var coord = sphere2Cartesian([0, 1.6, radius], radius, thetaScale(d.y), phiScale(d.x)-phiShift);
			var curve_string = coord[0] + ' ' + yScale(d.y) + ' ' + coord[2];
			var flat_string = xScale(d.x)-xShift + ' ' + yScale(d.y) + ' 0';
			if (curve) {
				//console.log(d.name + ' is curvy ' + curve_string);
				return d3.interpolate(flat_string, curve_string)
			} else {
				//console.log(d.name + ' is flat ' + flat_string);
				return d3.interpolate(curve_string, flat_string)
			}
		})
		.attrTween('rotation', function (d) {
			//console.log(xScale(d.x) + ' ' + yScale(d.y) + ' 0');
			console.log();
			var curve_string =  -thetaScale(d.y) + ' ' + -phiScale(d.x) + ' 0';
			//console.log(curve_string);
			var flat_string = '0 0 0';
			if (curve) {
				//console.log(d.name + ' is curvy ' + curve_string);
				return d3.interpolate(flat_string, curve_string)
			} else {
				//console.log(d.name + ' is flat ' + flat_string);
				return d3.interpolate(curve_string, flat_string)
			}
		});
	});
}

function getZ(x, rad) {
	return rad - (Math.sqrt((rad * rad) - (x * x)))
}
function sphere2Cartesian(origin, r, theta, phi) {
	let z = - r * Math.cos(phi*(Math.PI/180)) * Math.cos(theta*(Math.PI/180));
	let x = r * Math.sin(phi*(Math.PI/180));
	let y = r * Math.cos(phi*(Math.PI/180));
	let cartesian = [x + origin[0], y + origin[1], z + origin[2]]
	return cartesian

}
function getRot(x, rad) {
	return (Math.acos(x / rad) * 180 / Math.PI) - 90
}
function lerp(a, b, t) {
	var x = a + t * (b - a);
	return x;
}
