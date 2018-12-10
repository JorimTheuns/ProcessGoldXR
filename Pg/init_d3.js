var darkGold = "#db8a00";
var darkBlue = "#176ab7";
var lightGold = "#efe8dc";
var lightBlue = "#E0E7F2";

var pgData;

//human readable floats
var f = d3.format(".1f");

d3.json("data.json", function (error, json) {
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

    var shader = "flat";

    var connectedHeads = [];
    var connectedTails = [];

    var depth = false;
    var curve = false;

    var lineColor = "#2F86DA";

    //Set max dimensions of flat flow chart
    let maxWidth = 1.9;
    let maxHeight = 2.5;
    let eyeHeight = 0;

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
        .range([-maxHeight / 2, maxHeight / 2]);

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
        .range([d3.rgb(lightBlue), d3.rgb(darkBlue)]);

    var colorGold = d3.scaleLinear()
        .domain(cExtent)
        .interpolate(d3.interpolateHcl)
        .range([d3.rgb(lightGold), d3.rgb(darkGold)]);

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

    scene.append("a-entity")
        .attr("mixin", "graph-parent")
        .attr("class", "graph")
        .attr("id", "process-graph")
        .attr("position", "0 " + maxHeight / 2 + " " + -radius);

    var graph = scene.select("#process-graph");

    /*var position = graph.append("a-box")
        .attr("scale", "0.1 0.1 0.1");*/

    var nodes = graph.selectAll("#nodes")
        .data(nodeData)
        .enter()
        .append("a-entity")
        .attr("mixin", "node-parent")
        .attr("class", "node-parent")
        .attr("id", d => ('p' + d.nodeid))
        .attr("position", function (d, index) {
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
            return xScale(d.x) + ' ' + yScale(d.y) + ' 0'
        }).append("a-entity")
        .attr("mixin", "node-element")
        .attr("class", "node")
        .attr("id", d => ('n' + d.nodeid))
        //Normal GEO
        .attr('geometry', d => ('height: ' + 0.09 + ' ; width: ' + wScale(d.w)))
        //BEZIER TEST GEO
        //.attr('geometry', d => ('height: ' + 1 + ' ; width: ' + 1))
        .attr("material", d => ("color: " + colorBlue(d.weight)))
        .attr('text', d => ('value: ' + d.name + "; width: 1; color: " + getTextColor(colorBlue(d.weight)) + "; lineHeight: 52;"));

    nodes
        .on("animationcomplete", function (d) {
            if (d3.event.detail.name == "animation__selectheight") {
                d3.select(this).attr("text", d => ("value: " + d.name + "\n Weight: " + d.weight + "\n Frequency: " + d.selected.caseFreq + "\n" + f(d.selected.casePerc) + '%' + ";"))
            }
            this.components[d3.event.detail.name].animation.reset();
        })
        .on("grab-start", function (d) {
            d3.select(this).attr("text", d => ("value: ;"))
        })
        .on("grab-end", function (d) {
            d3.select(this).attr("text", d => ("value: " + d.name + ";"))
        });

    edges = graph.selectAll("#edges")
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
        .attr('linewidthstyler', 1)
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
            for (let i = 0; i < tP.length - 4; i++) {
                curvy_pathString += curvyCoords[i][0] + ' ' + curvyCoords[i][1] + ' ' + curvyCoords[i][2] + ', ';
                flat_pathString += xScale(tP[i].x) + ' ' + yScale(tP[i].y) + ' ' + -(zshift) + ', ';
            }
            curvy_pathString += curvyCoords[tP.length - 1][0] + ' ' + curvyCoords[tP.length - 1][1] + ' ' + curvyCoords[tP.length - 1][2];
            flat_pathString += xScale(tP[tP.length - 1].x) + ' ' + yScale(tP[tP.length - 1].y) + ' ' + (-zshift);
            curvyPaths[index] = curvy_pathString;
            flatPaths[index] = flat_pathString;
            if (curve) {
                return curvyPaths[index]
            } else {
                return flatPaths[index]
            }
        })
        //.attr('traces', d => ('fromNode: #n' + d.fromnode + '; toNode: #n' + d.tonode))
    ;
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
    //console.log(color);
    let r = color.r;
    let g = color.g;
    let b = color.b;
    if ((r + g + b) > 500) {
        //console.log("true");
        return "#000000"
    } else {
        //console.log("false");
        return "#ffffff"
    }
}
