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

    var lineColor = "#2F86DA";

    //Set max dimensions of flat flow chart
    let maxWidth = 1.5;
    let maxHeight = 2.5;
    let eyeHeight = 1.6;

    //set max dimensions of curved flow chart (in degrees)
    let maxTheta = 70;
    let maxPhi = 90;
    let radius = 1.5;

    //Sets how far behind the nodes the edges will render in both flat and curved mode
    let zshift = -0.05;

    //not sure
    let depthFactor = 0.3;
    let animateScale = 1;

    //sets the maximum complexity of the animation. Used to optimise FPS
    let lineResolution = 20;
    let showLabels = true;
    let animateDepth = true;

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

    //Simple Scale for Color
    let cExtent = d3.extent(nodeData, function (d) {
        return d.weight;
    });

    var colorBlue = d3.scaleLinear()
        .domain(cExtent)
        .interpolate(d3.interpolateHcl)
        .range([d3.rgb("#E0E7F2"), d3.rgb('#176ab7')]);

    var colorGold = d3.scaleLinear()
        .domain(cExtent)
        .interpolate(d3.interpolateHcl)
        .range([d3.rgb("#efe8dc"), d3.rgb('#db8a00')]);

    //Simple Scale for Width
    let wExtent = d3.extent(nodeData, function (d) {
        return d.w
    });

    var wScale = d3.scaleLinear()
        .domain(wExtent)
        .range([0.35, 0.75]);

    //Simple scale for lineWidth
    let lineWidthExtent = d3.extent(edgeData, function (d) {
        return d.weight
    });

    var lwScale = d3.scaleLinear()
        .domain(lineWidthExtent)
        .range([3, 20]);

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
        .attr('class', 'node cancurve')
        .attr('id', function (d) {
            return 'n' + d.nodeid
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
        .attr('material', function (d) {
            var materialString = 'shader: flat; color: ' + colorBlue(d.weight);
            return materialString
        })
        .attr('text', function (d) {
            var textString = 'color: ' + getTextColor(colorBlue(d.weight)) + '; align: center; value: ' + d.name + '; width: ' + 1 + '; lineHeight: ' + 72;
            return textString
        })
        .attr('animation__curveposition', function (d) {
            var curve_string, flat_string, animString;
            let curvyCoords = getCurvyCoords(pScale(d.x), tScale(d.y), radius, eyeHeight)
            curve_string = curvyCoords[0] + ' ' + curvyCoords[1] + ' ' + curvyCoords[2]
            flat_string = xScale(d.x) + ' ' + yScale(d.y) + ' ' + -radius;
            animString = "property: position; dir: alternate; dur: 1; loop: false; easing: easeInOutQuad; from: " + flat_string + "; to: " + curve_string + "; startEvents: curve"
            return animString
        })
        .attr('animation__flatposition', function (d) {
            var curve_string, flat_string, animString;
            let curvyCoords = getCurvyCoords(pScale(d.x), tScale(d.y), radius, eyeHeight)
            curve_string = curvyCoords[0] + ' ' + curvyCoords[1] + ' ' + curvyCoords[2]
            flat_string = xScale(d.x) + ' ' + yScale(d.y) + ' ' + -radius;
            animString = "property: position; dir: alternate; dur: 1; loop: false; easing: easeInOutQuad; from: " + curve_string + "; to: " + flat_string + "; startEvents: flat"
            return animString
        })
        .attr('animation__curverotation', function (d) {
            var animString;
            var curve_string = tScale(d.y) + ' ' + pScale(d.x) + ' 0';
            var flat_string = '0 0 0';
            animString = "property: rotation; dir: alternate; dur: 1; loop: false; easing: easeInOutQuad; from: " + flat_string + "; to: " + curve_string + "; startEvents: curve"
            return animString
        })
        .attr('animation__flatrotation', function (d) {
            var animString;
            var curve_string = tScale(d.y) + ' ' + pScale(d.x) + ' 0';
            var flat_string = '0 0 0';
            animString = "property: rotation; dir: alternate; dur: 1; loop: false; easing: easeInOutQuad; from: " + curve_string + "; to: " + flat_string + "; startEvents: flat"
            return animString
        })
        .attr('nodemousebehaviour', function (d) {
            var string = 'entercolor: ' + colorGold(d.weight) + '; enterscale: 1.2 1.2 1.2; downcolor: #444444; downscale: 1.2 1.2 1.2; upcolor: ' + colorGold(d.weight) + '; upscale: 1 1 1; leavecolor: ' + colorBlue(d.weight) + '; leavescale: 1 1 1';
            return string
        })
        .attr('nodeselectbehaviour', function (d) {
            var selecttext = d.name + "\n Weight: " + d.weight + "\n Frequency: " + d.selected.caseFreq + "\n" + f(d.selected.casePerc) + '%';
            var textcolor = getTextColor(colorBlue(d.weight));
            var height = 0.09;
            var tooltipString = 'text: ' + d.name + '; textcolor: ' + textcolor + '; selecttext: ' + selecttext + '; height: ' + height + '; selectheight: ' + height * 4 + '; width: ' + wScale(d.w) + '; selectwidth: ' + wScale(d.w);
            return tooltipString
        })
        .attr('labelbehaviour', "scale:false");;

    //Initialising edges
    var edges = scene.selectAll("#edges")
        .data(edgeData)
        .enter()
        .append("a-jline")
        .attr('class', 'cancurve')
        .attr('class', function (d) {
            return 'cancurve n' + d.fromnode + ' n' + d.tonode + ' l' + d.fromnode + d.tonode + d.weight
        })
        .attr('id', function (d) {
            return d.head + d.tail
        })
        .attr('color', function (d) {
            //console.log("linewidth should be: " + f(lwScale(d.weight)));
            return colorBlue(d.weight)
        })
        .attr('linewidth', function (d) {
            //console.log("linewidth should be: " + f(lwScale(d.weight)));
            return lwScale(d.weight)
        })
        .attr('linewidthstyler', function (d) {
            return "1"
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
                var points = bezier.getPoints(lineResolution);
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
        })
        .attr('animation__selectcolor', function (d) {
            var animString;
            var select_string = colorGold(d.weight);
            var normal_string = colorBlue(d.weight);
            animString = "property: color; dir: alternate; dur: 1; loop: false; easing: easeInOutQuad; from: " + normal_string + "; to: " + select_string + "; startEvents: select"
            return animString
        })
        .attr('animation__normalcolor', function (d) {
            var animString;
            var select_string = colorGold(d.weight);
            var normal_string = colorBlue(d.weight);
            animString = "property: color; dir: alternate; dur: 1; loop: false; easing: easeInOutQuad; from: " + select_string + "; to: " + normal_string + "; startEvents: deselect"
            return animString
        });

    if (showLabels){
        var labels = scene.selectAll("#labels")
        .data(edgeData)
        .enter()
        .append("a-entity")
        .attr('class', function (d) {
            return 'cancurve label l' + d.fromnode + d.tonode + d.weight
        })
        .attr('id', function (d) {
            return 'l' + d.fromnode + d.tonode + d.weight
        })
        .attr('position', function (d, index) {
            connectedTails[index] = edges.filter(function (eD) {
                return eD.tail == d.name
            });
            connectedHeads[index] = edges.filter(function (eD) {
                return eD.head == d.name
            });
            if (curve) {
                let curvyCoords = getCurvyCoords(pScale(d.labelx), tScale(d.labely), radius, eyeHeight)
                return curvyCoords[0] + ' ' + curvyCoords[1] + ' ' + curvyCoords[2]
            }
            return xScale(d.labelx) + ' ' + yScale(d.labely) + ' ' + -radius
        })
        .attr('scale', function () {
            return animateScale + ' 1 1'
        })
        .attr('geometry', function (d) {
            return 'primitive: plane; height: ' + 0.05 + ' ; width: ' + 0.12
        })
        .attr('rotation', function (d) {
            if (curve) {
                return tScale(d.labely) + ' ' + pScale(d.labelx) + ' 0'
            }
            return '0 0 0'
        })
        .attr('material', function (d) {
            var materialString = 'shader: flat; color: #F4F3F4; transparency: true; opacity: 0.5';
            return materialString
        })
        .attr('text', function (d) {
            var textString = 'color: black; align: center; value: ' + f(d.casePerc) + '%; width: ' + 0.6 + '; lineHeight: ' + 48;
            return textString
        })
        .attr('animation__curveposition', function (d) {
            var curve_string, flat_string, animString;
            let curvyCoords = getCurvyCoords(pScale(d.labelx), tScale(d.labely), radius, eyeHeight)
            curve_string = curvyCoords[0] + ' ' + curvyCoords[1] + ' ' + curvyCoords[2]
            flat_string = xScale(d.labelx) + ' ' + yScale(d.labely) + ' ' + -radius;
            animString = "property: position; dir: alternate; dur: 1; loop: false; easing: easeInOutQuad; from: " + flat_string + "; to: " + curve_string + "; startEvents: curve"
            return animString
        })
        .attr('animation__flatposition', function (d) {
            var curve_string, flat_string, animString;
            let curvyCoords = getCurvyCoords(pScale(d.labelx), tScale(d.labely), radius, eyeHeight)
            curve_string = curvyCoords[0] + ' ' + curvyCoords[1] + ' ' + curvyCoords[2]
            flat_string = xScale(d.labelx) + ' ' + yScale(d.labely) + ' ' + -radius;
            animString = "property: position; dir: alternate; dur: 1; loop: false; easing: easeInOutQuad; from: " + curve_string + "; to: " + flat_string + "; startEvents: flat"
            return animString
        })
        .attr('animation__curverotation', function (d) {
            var animString;
            var curve_string = tScale(d.labely) + ' ' + pScale(d.labelx) + ' 0';
            var flat_string = '0 0 0';
            animString = "property: rotation; dir: alternate; dur: 1; loop: false; easing: easeInOutQuad; from: " + flat_string + "; to: " + curve_string + "; startEvents: curve"
            return animString
        })
        .attr('animation__flatrotation', function (d) {
            var animString;
            var curve_string = tScale(d.labely) + ' ' + pScale(d.labelx) + ' 0';
            var flat_string = '0 0 0';
            animString = "property: rotation; dir: alternate; dur: 1; loop: false; easing: easeInOutQuad; from: " + curve_string + "; to: " + flat_string + "; startEvents: flat"
            return animString
        })
        .attr('labelbehaviour', "scale:true")
        .attr('labelcolorbehaviour', "scale:true")
        .attr('nodeselectbehaviour', function (d) {
            var selecttext = "From: " + d.head + "\n To: " + d.tail + "\n Frequency: " + d.caseFreq + "\n" + f(d.casePerc) + '%';
            var textcolor = "black";
            var height = 0.03;
            var width = 0.12;
            var tooltipString = 'text: ' + f(d.casePerc) + '%; textcolor: ' + textcolor + '; selecttext: ' + selecttext + '; height: ' + height + '; selectheight: ' + height * 5 + '; width: ' + width + '; selectwidth: ' + width*4;
            return tooltipString
        })
        .attr('mouseinteraction', function (d) {
            var string = 'entercolor: white; enterscale: 1 1 1; downcolor: #444444; downscale: 1 1 1; upcolor: white; upscale: 1 1 1; leavecolor: white; leavescale: 1 1 1';
            return string
        });
    }
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

function getTextColor(c) {
    let color = d3.rgb(c);
    console.log(color);
    let r = color.r;
    let g = color.g;
    let b = color.b;
    if ((r + g + b) > 500) {
        console.log("true");
        return "#000000"
    } else {
        console.log("false");
        return "#ffffff"
    }
}
