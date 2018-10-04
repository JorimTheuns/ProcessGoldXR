var pgData;

d3.json("InvoiceJune2016.json", function (error, json) {
    if (error)
        return console.warn(error);
    pgData = json;
    visualise();
});

function visualise() {

    var scene = d3.select('a-scene');
    var curveButton = d3.select('#curveButton');

    var nodeData = pgData.graph.nodes;
    var edgeData = pgData.graph.edges;

    var curvyPaths = [];
    var flatPaths = [];

    var nodes = [];
    var edges = [];

    var connectedHeads = [];
    var connectedTails = [];

    var depth = false;
    var curve = false;

    var lineColor = "#0049E2";

    //Set max dimensions of flat flow chart
    let maxWidth = 3;
    let maxHeight = 2.5;
    let eyeHeight = 1.6;

    //set max dimensions of curved flow chart (in degrees)
    let maxTheta = 90;
    let maxPhi = 120;
    let radius = 1.5;

    //Sets how far behind the nodes the edges will render in both flat and curved mode
    let zshift = -0.05;

    //not sure
    let depthFactor = 0.3;
    let animateScale = 1;

    //sets the maximum complexity of the animation. Used to optimise FPS
    let animateResolution = 1;

    //human readable floats
    let f = d3.format(".3f");

    //Function that takes nodeData, finds absolute max distance from center
    //creates scale that aligns all data around centerpoint
    let xShift = pgData.graph.centralpoint.x;
    let xmax = d3.max(nodeData, function (d) {
        return d.x
    });
    let xmin = d3.min(nodeData, function (d) {
        return d.x
    });
    let xAbsMax = Math.max(Math.abs(xShift - xmax), Math.abs(xShift - xmin));
    var xScale = d3.scaleLinear()
        .domain([xShift, xShift + xAbsMax])
        .range([0, maxWidth / 2]);

    //almost same as xScale
    //limits between 0 and maxheight
    //inverts the y axis
    let yShift = pgData.graph.centralpoint.y;
    let ymax = d3.max(nodeData, function (d) {
        return d.y
    });
    let ymin = d3.min(nodeData, function (d) {
        return d.y
    });
    let yAbsMax = Math.max(Math.abs(yShift - ymax), Math.abs(yShift - ymin));
    var yScale = d3.scaleLinear()
        .domain([yShift + yAbsMax, yShift - yAbsMax])
        .range([0, maxHeight]);

    //Scale for horisontal sweep angle (Phi)
    var pScale = d3.scaleLinear()
        .domain([xShift, xShift + xAbsMax])
        .range([0, -maxPhi / 2])

    //Scale for vertial elevation angle (Theta)
    //Makes eyeHeight = 0
    var tScale = d3.scaleLinear()
        .domain([yScale.invert(eyeHeight), yScale.invert(eyeHeight) - yAbsMax])
        .range([0, maxTheta / 2]);

    //Simple Scale for Width
    let wExtent = d3.extent(nodeData, function (d) {
        return d.w
    });

    var wScale = d3.scaleLinear()
        .domain(wExtent)
        .range([0.4, 0.9]);

    //Simple scale for lineWidth
    let lineWidthExtent = d3.extent(edgeData, function (d) {
        return d.weight
    });

    var lwScale = d3.scaleLinear()
        .domain(lineWidthExtent)
        .range([1, 10]);

    /* //TestingX
    console.log("Testing X");
    console.log(xmax + ' max = ' + f(xScale(xmax)));
    console.log(xShift + ' center = ' + f(xScale(xShift)));
    console.log(xmin + ' min = ' + f(xScale(xmin)));

    //TestingY
    console.log("Testing Y")
    console.log(ymax + ' max = ' + f(yScale(ymax)));
    console.log(yShift + ' center = ' + f(yScale(yShift)));
    console.log(ymin + ' min = ' + f(yScale(ymin)));

    //Testing Sweep Angle (Phi)
    console.log("Testing Phi")
    console.log(xmax + ' max = ' + f(pScale(xmax)));
    console.log(xShift + ' center = ' + f(pScale(xShift)));
    console.log(xmin + ' min = ' + f(pScale(xmin)));

    //Testing Elevation Angle(Theta)
    console.log("Testing Theta")
    console.log(ymax + ' max = ' + f(tScale(ymax)));
    console.log(yShift + ' center = ' + f(tScale(yShift)));
    console.log(yScale.invert(eyeHeight) + ' eye height = ' + f(tScale(yScale.invert(eyeHeight))));
    console.log(ymin + ' min = ' + f(tScale(ymin)));

    //Testing line Width
    console.log("Testing Line width")
    console.log(1000 + ' 1000 = ' + f(lwScale(1000)));
     */

    //initialising edges and nodes

    var nodes = scene.selectAll("#nodes")
        .data(nodeData)
        .enter()
        .append("a-entity")
        .attr('class', 'node')
        .attr('class', 'cancurve')
        .attr('id', function (d) {
            return d.name
        })
        .attr('position', function (d, index) {
            connectedTails[index] = edges.filter(function (eD) {
                return eD.tail == d.name
            });
            connectedHeads[index] = edges.filter(function (eD) {
                return eD.head == d.name
            });
            if (curve) {
                let curvyCoords = getCurvyCoords(pScale(d.x), tScale(d.y), radius, eyeHeight)
                return curvyCoords[0] + ' ' + curvyCoords[1] + ' ' + curvyCoords[2]
            }
            return xScale(d.x) + ' ' + yScale(d.y) + ' ' + -radius
        })
        .attr('scale', function () {
            return animateScale + ' 1 1'
        })
        .attr('geometry', function (d) {
            return 'primitive: plane; height: ' + 0.09 + ' ; width: ' + wScale(d.w)
        })
        .attr('rotation', function (d) {
            if (curve) {
                return tScale(d.y) + ' ' + pScale(d.x) + ' 0'
            }
            return '0 0 0'
        })
        .attr('material', 'shader: flat; color: white')
        .attr('text', function (d) {
            var textString = 'color: black; align: center; value: ' + d.name + '; width: ' + 1  + '; lineHeight: ' + 72 ;
            return textString
        })
        .attr('animation__curveposition', function (d) {
            var curve_string, flat_string, animString;
            let curvyCoords = getCurvyCoords(pScale(d.x), tScale(d.y), radius, eyeHeight)
            curve_string = curvyCoords[0] + ' ' + curvyCoords[1] + ' ' + curvyCoords[2]
            flat_string = xScale(d.x) + ' ' + yScale(d.y) + ' ' + -radius;
            animString = "property: position; dir: alternate; dur: 100; loop: false; easing: easeInOutQuad; from: " + flat_string + "; to: " + curve_string + "; startEvents: curve"
            return animString
        })
        .attr('animation__flatposition', function (d) {
            var curve_string, flat_string, animString;
            let curvyCoords = getCurvyCoords(pScale(d.x), tScale(d.y), radius, eyeHeight)
            curve_string = curvyCoords[0] + ' ' + curvyCoords[1] + ' ' + curvyCoords[2]
            flat_string = xScale(d.x) + ' ' + yScale(d.y) + ' ' + -radius;
            animString = "property: position; dir: alternate; dur: 100; loop: false; easing: easeInOutQuad; from: " + curve_string + "; to: " + flat_string + "; startEvents: flat"
            return animString
        })
        .attr('animation__curverotation', function (d) {
            var animString;
            var curve_string = tScale(d.y) + ' ' + pScale(d.x) + ' 0';
            var flat_string = '0 0 0';
            animString = "property: rotation; dir: alternate; dur: 100; loop: false; easing: easeInOutQuad; from: " + flat_string + "; to: " + curve_string + "; startEvents: curve"
            return animString
        })
        .attr('animation__flatrotation', function (d) {
            var animString;
            var curve_string = tScale(d.y) + ' ' + pScale(d.x) + ' 0';
            var flat_string = '0 0 0';
            animString = "property: rotation; dir: alternate; dur: 100; loop: false; easing: easeInOutQuad; from: " + curve_string + "; to: " + flat_string + "; startEvents: flat"
            return animString
        })
        .attr('nodemousebehaviour', 'entercolor: #eeeeee; enterscale: 1.2 1.2 1.2; downcolor: #eeeeee; downscale: 1.2 1.2 1.2; upcolor: #eeeeee; upscale: 1.2 1.2 1.2; leavecolor: #ffffff; leavescale: 1 1 1')
        .attr('nodeselectbehaviour', function (d) {
            var selecttext = d.name + "\n Weight: " + d.weight + "\n Frequency: " + d.selected.caseFreq + "\n" + f(d.selected.casePerc) + '%';
            var height = 0.09;
            var tooltipString = 'text: ' + d.name + '; selecttext: ' + selecttext + '; height: ' + height + '; selectheight: ' + height*5;
            return tooltipString
        });

    //Initialising edges
    var edges = scene.selectAll("#edges")
        .data(edgeData)
        .enter()
        .append("a-jline")
        .attr('class', 'cancurve')
        .attr('id', function (d) {
            return d.head
        })
        .attr('color', lineColor)
        .attr('linewidth', function (d) {
            //console.log("linewidth should be: " + f(lwScale(d.weight)));
            return lwScale(d.weight)
        })
        //.attr('linewidth', '100')
        .attr('path', function (d, index) {

            var curvy_pathString = '';
            var flat_pathString = '';
            var tP = [];
            var p = d.controlpoints;
            let numberOfCurves = (p.length - 1) / 3;

            for (let i = 0; i < numberOfCurves; i++) {
                let j = i * 3;
                var bezier = new THREE.CubicBezierCurve3(
                    new THREE.Vector3(p[0 + j].x, p[0 + j].y, p[0 + j].z),
                    new THREE.Vector3(p[1 + j].x, p[1 + j].y, p[1 + j].z),
                    new THREE.Vector3(p[2 + j].x, p[2 + j].y, p[2 + j].z),
                    new THREE.Vector3(p[3 + j].x, p[3 + j].y, p[3 + j].z));
                var points = bezier.getPoints(20);
                tP.push(...points);
            }
            let curvyCoords = [];
            for (let i = 0; i < tP.length; i++) {
                curvyCoords[i] = getCurvyCoords(pScale(tP[i].x), tScale(tP[i].y), radius - zshift, eyeHeight);
            }
            for (let i = 0; i < tP.length - 1; i++) {
                curvy_pathString += curvyCoords[i][0] + ' ' + curvyCoords[i][1] + ' ' + curvyCoords[i][2] + ', ';
                flat_pathString += xScale(tP[i].x) + ' ' + yScale(tP[i].y) + ' ' + -(radius - zshift) + ', ';
            }
            curvy_pathString += curvyCoords[tP.length - 1][0] + ' ' + curvyCoords[tP.length - 1][1] + ' ' + curvyCoords[tP.length - 1][2];
            flat_pathString += xScale(tP[tP.length - 1].x) + ' ' + yScale(tP[tP.length - 1].y) + ' ' + -(radius - zshift);
            curvyPaths[index] = curvy_pathString;
            flatPaths[index] = flat_pathString;
            if (curve) {
                return curvyPaths[index]
            } else {
                return flatPaths[index]
            }
        })
        .attr('animation__curveline', function (d, i) {
            var animString;
            animString = "property: path; delay: 0; dir: alternate; dur: 100; loop: false; from: " + flatPaths[i] + "; to: " + curvyPaths[i] + "; startEvents: curve"
            return animString
        }).attr('animation__flatline', function (d, i) {
            var animString;
            animString = "property: path; delay: 0; dir: alternate; dur: 100; loop: false; from: " + curvyPaths[i] + "; to: " + flatPaths[i] + "; startEvents: flat"
            return animString
        });
    /*
    	curveButton
    	.on("mouseenter", function () {
    		curveButton.transition().duration(500).attr('scale', '1.2 1.2 1.2');
    	})
    	.on("mouseleave", function (d, i) {
    		curveButton.transition().duration(2000).attr('scale', '1 1 1').attr('color', '#0049E2');
    	})
    	.on("click", function () {
    		console.log('click');

    		//Curve cutton transition styling
    		curveButton.transition().duration(100).attr('color', '#750ddd');
    		curve = !curve;

    		//node transitions
    		scene.selectAll("#node")
    		.data(nodeData)
    		.transition()
    		.duration(500)
    		.attrTween('position', function (d) {
    			var curve_string,
    			flat_string;
    			let curvyCoords = getCurvyCoords(pScale(d.x), tScale(d.y), radius, eyeHeight)
    				curve_string = curvyCoords[0] + ' ' + curvyCoords[1] + ' ' + curvyCoords[2]
    				flat_string = xScale(d.x) + ' ' + yScale(d.y) + ' ' + -radius;
    			if (curve) {
    				return d3.interpolate(flat_string, curve_string)
    			} else {
    				return d3.interpolate(curve_string, flat_string)
    			}
    		})
    		.attrTween('rotation', function (d) {
    			var curve_string = tScale(d.y) + ' ' + pScale(d.x) + ' 0';
    			var flat_string = '0 0 0';
    			if (curve) {
    				return d3.interpolate(flat_string, curve_string)
    			} else {
    				return d3.interpolate(curve_string, flat_string)
    			}
    		});

    		//edge transitions

    		scene.selectAll("#edge")
    		.data(edgeData)
    		.transition()
    		.duration(500)
    		.attr('color', lineColor)
    		.attr('linewidth', function (d) {
    			return lwScale(d.weight)
    		})
    		.attr('path', function (d, i) {
    			if (curve) {
    				return curvyPaths[i]
    			} else {
    				return flatPaths[i]
    			}
    		});
    	});
    	scene.selectAll('.node').on("mouseenter", function (n, i) {
    		d3.select(this).transition().duration(1000).attr('scale', '1.2 1.2 1.2');
    		edges.filter(function (d) {
    			return d.tail == n.name
    		})
    		.transition()
    		.duration(1000)
    		.attr('linewidth', function (d) {
    			return lwScale(d.weight) * 2
    		})
    		.attr('color', 'green');
    		edges.filter(function (d) {
    			return d.head == n.name
    		})
    		.transition()
    		.duration(1000)
    		.attr('linewidth', function (d) {
    			return lwScale(d.weight) * 2
    		})
    		.attr('color', 'red');
    	})
    	.on("mouseleave", function (n, i) {
    		d3.select(this).transition().duration(1000).attr('scale', '1 1 1');
    		edges.filter(function (d) {
    			return d.tail == n.name
    		})
    		.transition()
    		.duration(1000)
    		.attr('linewidth', function (d) {
    			return lwScale(d.weight)
    		})
    		.attr('color', lineColor);
    		edges.filter(function (d) {
    			return d.head == n.name
    		})
    		.transition()
    		.duration(1000)
    		.attr('linewidth', function (d) {
    			return lwScale(d.weight)
    		})
    		.attr('color', lineColor);
    	});
        */
}

function getCurvyCoords(x, y, radius, eyeHeight) {
    let xC = -radius * Math.sin(x * (Math.PI / 180)) * Math.cos(y * (Math.PI / 180));
    let yC = eyeHeight + radius * Math.sin(y * (Math.PI / 180));
    let zC = -radius * Math.cos(x * (Math.PI / 180)) * Math.cos(y * (Math.PI / 180));
    let curvyCoords = [xC, yC, zC];
    return curvyCoords
}

/*

var yScale = d3.scaleLinear()
.domain(d3.max(nodeData, function(d){return d.y}))
.range([maxHeight, 0.5]);

var textScale = d3.scaleLinear()
.domain(d3.extent(nodeData, function(d){return d.w}))
.range([0.5, 0.8]);

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
*/
