var darkGold = "#db8a00";
var darkBlue = "#176ab7";
var lightGold = "#efe8dc";
var lightBlue = "#E0E7F2";

var pgData, nodeData, edgeData, wScale, tScale, zScale, weightScale;

//human readable floats
var f = d3.format(".1f");

d3.json("data.json", function (error, json) {
    if (error)
        return console.warn(error);
    pgData = json;

    nodeData = pgData.graph.nodes;
    edgeData = pgData.graph.edges;

    visualise();

});

function visualise() {

    var scene = d3.select('a-scene');
    var curveButton = d3.select('#curveButton');

    var curvyPaths = [];
    var flatPaths = [];

    var nodes = [];
    var edges = [];

    var shader = "flat";

    var connectedHeads = [];
    var connectedTails = [];

    var depth = false;
    var curve = true;

    var lineColor = "#2F86DA";

    //Set max dimensions of flat flow chart
    let maxWidth = 1.9;
    let maxHeight = 2.5;
    let eyeHeight = 0;

    //set max dimensions of curved flow chart (in degrees)
    let maxTheta = 60;
    let maxPhi = 90;
    let radius = 1.5;

    //Sets how far behind the nodes the edges will render in both flat and curved mode
    let zshift = 0;

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
    tScale = d3.scaleLinear()
        .domain([yAbsMax, -yAbsMax])
        .range([0, (maxTheta)]);

    //Simple Scale for Color
    let cExtent = d3.extent(nodeData, function (d) {
        return d.weight;
    });

    if (curve) {
        zScale = d3.scaleLinear()
            .domain(cExtent)
            .range([-radius, 0]);
    } else {
        zScale = d3.scaleLinear()
            .domain(cExtent)
            .range([-0.1, 0]);
    }

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

    if (curve) {
        wScale = d3.scaleLinear()
            .domain(wExtent)
            .range([0.32, 0.9]);
    } else {
        wScale = d3.scaleLinear()
            .domain(wExtent)
            .range([0.35, 0.75]);
    }

    //Simple scale for lineWidth
    let lineWidthExtent = d3.extent(edgeData, function (d) {
        return d.weight
    });

    var lwScale = d3.scaleLinear()
        .domain(lineWidthExtent)
        .range([3, 20]);

    weightScale = d3.scaleLinear()
        .domain(cExtent)
        .range([2, 1]);

    scene.append("a-entity")
        .attr("mixin", "graph-parent")
        .attr("class", "graph")
        .attr("id", "process-graph")
        .attr("position", "0 " + 1.6 + " 0");

    scene.append("a-entity")
        .attr("mixin", "graph-parent")
        .attr("class", "graph")
        .attr("id", "process-forcegraph")
        .attr("position", "0 " + 1.6 + " 0");

    var graph = scene.select("#process-graph");

    //var position = graph.append("a-box").attr("scale", "0.1 0.1 0.1");

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
                let curvyCoords = getCurvyCoords(pScale(d.x), tScale(d.y), radius);
                var spherical = new THREE.Spherical();
                spherical.setFromVector3(curvyCoords);
                return curvyCoords.x + ' ' + curvyCoords.y + ' ' + curvyCoords.z
            }
            return xScale(d.x) + ' ' + yScale(d.y) + ' ' + -radius
        })
        .append("a-entity")
        .attr("mixin", "node-element")
        .attr("class", "node")
        .attr("id", d => ('n' + d.nodeid))
        //Normal GEO
        .attr('geometry', d => ('height: ' + 0.09 + ' ; width: ' + wScale(d.w)))
        //BEZIER TEST GEO
        //.attr('geometry', d => ('height: ' + 1 + ' ; width: ' + 1))
        .attr("material", d => ("color: " + colorBlue(d.weight)))
        .attr('text', d => ('value: ' + d.name + "; width: 1; color: " + getTextColor(colorBlue(d.weight)) + "; lineHeight: 52;"))
        .attr("position", d => ("0 0 " + zScale(d.weight)))
    //.attr("scale", d => (weightScale(d.weight) + " " + weightScale(d.weight) + " 1"))
    ;

    nodes
        .attr("animation__selectpos", d => ("from: 0 0 " + zScale(d.weight) + "; to: 0 0 0.5"))
        .attr("animation__deselectpos", d => ("from: 0 0 0.5; to: 0 0 " + zScale(d.weight) + ";"));

    nodes
        .on("animationcomplete", function (d) {
            if (this.is("selected")) {
                if (d3.event.detail.name == "animation__selectheight") {
                    d3.select(this).attr("text", d => ("value: " + d.name + "\n Weight: " + d.weight + "\n Frequency: " + d.selected.caseFreq + "\n" + f(d.selected.casePerc) + '%' + ";"))
                }
                this.components[d3.event.detail.name].animation.reset();
            }
        })
        //Define dynamic behaviours
        .on("grab-start", function (d, i) {
            this.emit("select");
            this.addState('selected');
            emitToEdges(this, d, "select");
            setColor(this, d, colorGold(d.weight));
            //setText(this, d, "Loading");
            d3.select(this)
                .on("hover-end", function (d) {});
        })
        .on("grab-end", function (d) {
            this.emit("deselect");
            this.removeState('selected');
            emitToEdges(this, d, "deselect");
            setColor(this, d, colorBlue(d.weight));
            setText(this, d, d.name);
            d3.select(this)
                .on("hover-end", function (d) {
                    setColor(this, d, colorBlue(d.weight));
                    emitToEdges(this, d, "deselect");
                });
            //console.log("grab ended");
        })
        .on("hover-start", function (d) {
            setColor(this, d, colorGold(d.weight));
            emitToEdges(this, d, "select");
        })
        .on("hover-end", function (d) {
            setColor(this, d, colorBlue(d.weight));
            emitToEdges(this, d, "deselect");
        })
        .on("select", function (d) {
            console.log("Selected" + d.name);
        })
        .on("deselect", function (d) {
            console.log("Deselected" + d.name);
        });

    var emitToEdges = function (el, d, event) {
        var name = AFRAME.utils.entity.getComponentProperty(el, 'id');
        name = '.' + name;
        var edges = el.sceneEl.querySelectorAll(name);
        for (var i = 0; i < edges.length; i++) {
            edges[i].emit(event);
        }
    }

    var setColor = function (el, d, color) {
        if (el.classList.contains("edge")) {
            d3.select(el).attr("color", d => (color));
        } else {
            d3.select(el).attr("material", d => ("color: " + color));
        }
    };

    var setText = function (el, d, text) {
        d3.select(el).attr("text", d => ("value: " + text + ";"))
    };

    edges = graph.selectAll("#edges")
        .data(edgeData)
        .enter()

        //CLASSIC PATH DRAW

        .append("a-jline")
        .attr('class', function (d) {
            return 'edge n' + d.fromnode + ' n' + d.tonode + ' l' + d.fromnode + d.tonode + d.weight
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

            var catmullRom = false;

            var curvy_pathString = '';
            var flat_pathString = '';
            var tP = [];
            var p = d.controlpoints;
            let numberOfPoints = ((p.length - 1) / 3) + 1;
            let numberOfCurves = ((p.length - 1) / 3);

            if (catmullRom) {
                var catmullRom = new THREE.CatmullRomCurve3();
                var controlPoints = [];

                if (numberOfPoints > 2) {
                    for (let i = 0; i < numberOfPoints; i++) {
                        let j = i * 3;
                        var point;
                        if (i == 0) {
                            var offset = new THREE.Vector3(p[0].x, p[0].y, p[0].z);
                            point = getNodeCoordsOffset(d.fromnode, offset);
                        } else if (i == numberOfPoints - 1) {
                            var offset = new THREE.Vector3(p[j - 1].x, p[j - 1].y, p[j - 1].z);
                            point = getNodeCoordsOffset(d.tonode, offset);
                        } else {
                            point = new THREE.Vector3(p[j].x, p[j].y, p[j].z);
                        }
                        controlPoints.push(point);
                    }
                } else {
                    let cP = [];
                    for (let k = 0; k < 4; k++) {
                        cP[k] = new THREE.Vector3(p[k].x, p[k].y, p[k].z)
                    }
                    var start = getNodeCoordsOffset(d.fromnode, cP[0]);
                    var end = getNodeCoordsOffset(d.tonode, cP[3]);
                    controlPoints = [start, cP[1], cP[2], end];
                }

                //console.log(controlPoints);

                catmullRom.tension = 100;

                catmullRom.points = controlPoints;

                tP = catmullRom.getPoints(100);
            } else {
                if (d.fromnode == d.tonode) {
                    let bezierControlPoints = [];

                    console.log("SELF NODE!");
                    
                    var n = nodeData.find(x => x.nodeid === d.fromnode);

                    var aspect = wScale(n.w) / 0.09;

                    var w = n.w / 2;
                    var width = w / weightScale(n.weight);
                    var height = ((w / aspect) / weightScale(n.weight)) * 3;
                    var h = n.h / 2;
                    console.log(w, width, height);

                    for (let k = 0; k < 4; k++) {
                        bezierControlPoints[k] = new THREE.Vector3(p[k].x + w*0.5, p[k].y + h*0.5, p[k].z)
                    }

                    var bezier = new THREE.CubicBezierCurve3(bezierControlPoints[0], bezierControlPoints[1], bezierControlPoints[2], bezierControlPoints[3]);
                    var points = bezier.getSpacedPoints(30);
                    //points.pop();
                    tP.push(...points);
                } else {
                    for (let i = 0; i < numberOfCurves; i++) {
                        let j = i * 3;
                        let bezierControlPoints = [];
                        for (let k = 0; k < 4; k++) {
                            bezierControlPoints[k] = new THREE.Vector3(p[k + j].x, p[k + j].y, p[k + j].z)
                        }

                        if (i == 0) {
                            var offset = new THREE.Vector3(p[1].x, p[1].y, p[1].z);
                            bezierControlPoints[0] = getNodeCoordsOffset(d.fromnode, offset);
                        } else if (i == numberOfCurves - 1) {
                            var offset = new THREE.Vector3(p[j + 2].x, p[j + 2].y, p[j + 2].z);
                            bezierControlPoints[3] = getNodeCoordsOffset(d.tonode, offset);
                        }
                        var bezier = new THREE.CubicBezierCurve3(bezierControlPoints[0], bezierControlPoints[1], bezierControlPoints[2], bezierControlPoints[3]);
                        var points = bezier.getSpacedPoints(30);
                        //points.pop();
                        tP.push(...points);
                    }
                }
            }

            let curvyCoords = [];
            var fromRad = getZ(d.fromnode);
            var toRad = getZ(d.tonode);
            var renderCurve = new THREE.CatmullRomCurve3();
            renderCurve.points = tP;

            var tP = renderCurve.getSpacedPoints(200);
            var stepsize = 1 / tP.length;

            for (let i = 0; i < tP.length; i++) {
                curvyCoords[i] = getCurvyCoords(pScale(tP[i].x), tScale(tP[i].y), radius - zshift - THREE.Math.lerp(fromRad, toRad, stepsize * i));
            }
            for (let i = 0; i < tP.length - 1; i++) {
                curvy_pathString += curvyCoords[i].x + ' ' + curvyCoords[i].y + ' ' + curvyCoords[i].z + ', ';
                flat_pathString += xScale(tP[i].x) + ' ' + yScale(tP[i].y) + ' ' + -(zshift + radius) + ', ';
            }
            curvy_pathString += curvyCoords[tP.length - 1].x + ' ' + curvyCoords[tP.length - 1].y + ' ' + curvyCoords[tP.length - 1].z;
            flat_pathString += xScale(tP[tP.length - 1].x) + ' ' + yScale(tP[tP.length - 1].y) + ' ' + -(zshift + radius);
            curvyPaths[index] = curvy_pathString;
            flatPaths[index] = flat_pathString;
            if (curve) {
                return curvyPaths[index]
            } else {
                return flatPaths[index]
            }
        })
        .on("select", function (d) {
            setColor(this, d, colorGold(d.weight));
        })
        .on("deselect", function (d) {
            setColor(this, d, colorBlue(d.weight));
        });;
    /*
            .append("a-entity")
            .attr('class', 'cancurve')
            .attr('class', function (d) {
                return 'n' + d.fromnode + ' n' + d.tonode
            })
            .attr('id', function (d) {
                return 'l' + d.fromnode + d.tonode + d.weight
            })
            .attr('color', function (d) {
                //console.log("linewidth should be: " + f(lwScale(d.weight)));
                return colorBlue(d.weight)
            })/*
            .attr('traces', function (d, i) {
                var pathString = '';
                var tP = [];
                var path = new THREE.CurvePath();
                var p = d.controlpoints;
                let numberOfCurves = (p.length - 1) / 3;

                for (let i = 0; i < numberOfCurves; i++) {
                    let j = i * 3;
                    var bezier;
                    var coords = [];
                    for (let k = 0; k < 4; k++) {
                        if (curve) {
                            coords[k] = getCurvyCoords(pScale(p[k + j].x), tScale(p[k + j].y), radius);
                        } else {
                            coords[k] = new THREE.Vector3(xScale(p[k + j].x), yScale(p[k + j].y), 0);
                        }
                    }
                    bezier = new THREE.CubicBezierCurve3(coords[0], coords[1], coords[2], coords[3]);
                    path.add(bezier);
                }
                var pathJSON = path.toJSON();
                console.log(pathJSON);

                pathstring = 'fromNode: #n' + d.fromnode + '; toNode: #n' + d.tonode + "; controlPoints: " + JSON.stringify(pathJSON) + "; catmull: false";
                return pathstring
            })
            .attr('traces', function (d, i) {
                var pathstring = '';
                var pathArray = [];
                var curve = new THREE.CatmullRomCurve3();
                var p = d.controlpoints;
                let numberOfCurves = (p.length - 1) / 3;

                for (let i = 0; i < numberOfCurves; i++) {
                    let j = i * 3;
                    vec3 = getCurvyCoords(pScale(p[j].x), tScale(p[j].y), radius);
                    pathArray.push(vec3);
                }
            
                var curve = new THREE.CatmullRomCurve3(pathArray);
                var pathJSON = curve.toJSON();
                console.log(pathJSON);

                pathstring = 'fromNode: #n' + d.fromnode + '; toNode: #n' + d.tonode + "; controlPoints: " + JSON.stringify(pathJSON) + "; catmull: true";
                return pathstring
            })*/
    /*
        var forcegraph = scene.select("#process-forcegraph");

        forcegraph.append("a-entity")
            .attr("mixin", "graph-parent")
            .attr("class", "graph")
            .attr("id", "process-forcegraph")
            .attr("position", "0 0 1.5")
            .attr("rotation", "0 180, 0")
            .attr("scale", "0.01 0.01 0.01")
            .attr("forcegraph", "nodes: " + JSON.stringify(nodeData) + "; links: " + JSON.stringify(edgeData) + "; node-id: nodeid; link-source: fromnode; link-target: tonode; link-width: 1; num-dimensions: 3")
            .attr("node-object", "height: 9; width: 100;");*/
}

function getZ(id) {
    var n = nodeData.find(x => x.nodeid === id);
    var z = zScale(n.weight);
    return z
}

function getNodeCoords(id) {
    var n = nodeData.find(x => x.nodeid === id);
    var nodeCoords = new THREE.Vector3(n.x, n.y, 0);
    return nodeCoords
}

function getNodeCoordsOffset(id, offsetvector) {
    var n = nodeData.find(x => x.nodeid === id);


    var aspect = wScale(n.w) / 0.09;

    var w = n.w / 2;
    var width = w / weightScale(n.weight);
    var height = ((w / aspect) / weightScale(n.weight)) * 3;
    var h = n.h / 2;

    console.log(n.name, n.w, wScale(n.w));

    /*
    console.log(n.name);
    console.log("aspect: " + aspect + "; calcH: " + n.w / aspect + "; h: " + n.h + "; w: " + n.w + "; Scaled w: " + wScale(n.w) + "; weight: " + weightScale(n.weight));
    console.log("height: " + height + "; width: " + width + "; Scaled w: " + w);
    console.log("x: " + n.x + "; y: " + n.y + "; offset x: " + offsetvector.x + "; offset y: " + offsetvector.y);
    
    */
    //var w = n.w/2;
    //var width = (w / (1.5+zScale(n.weight)))*1.5;

    var newX = offsetvector.x;
    var newY = offsetvector.y;

    var nodeCoords = new THREE.Vector3();

    var a = (offsetvector.y < n.y);
    var b = (offsetvector.y > n.y);
    var va = (offsetvector.y < n.y - h);
    var vb = (offsetvector.y > n.y + h);

    var l = (offsetvector.x < n.x);
    var r = (offsetvector.x > n.x);
    var vl = (offsetvector.x < n.x - width*0.7);
    var vr = (offsetvector.x > n.x + width*0.7);

    console.log("va: " + va + "; vb: " + vb + "; vl: " + vl + "; vr: " + vr);

    if (va && (!vl && !vr)) {
        newY = n.y - height;
        console.log("a");
    }
    if (vb && (!vl && !vr)) {
        newY = n.y + height;
        console.log("b");
    }
    if (vl) {
        newX = n.x - width;
        //newY = n.y;
        console.log("l");
    }
    if (vr) {
        newX = n.x + width;
        //newY = n.y;
        console.log("r");
    }


    nodeCoords.set(newX, newY, 0);
    return nodeCoords
}

function calcAngle(opposite, adjacent) {
    return Math.atan(opposite / adjacent);
}

function getCurvyCoords(x, y, radius) {
    let xC = -radius * Math.sin(x * (Math.PI / 180)) * Math.cos(y * (Math.PI / 180));
    let yC = radius * Math.sin(y * (Math.PI / 180));
    let zC = -radius * Math.cos(x * (Math.PI / 180)) * Math.cos(y * (Math.PI / 180));
    let curvyCoords = new THREE.Vector3(xC, yC, zC);
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
