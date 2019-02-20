var darkGold = "#cc8100";
var darkBlue = "#1f73c2";
var lightGold = "#ffd282";
var lightBlue = "#adcdff";

var pgData, nodeData, edgeData;
//human readable floats
var f = d3.format(".1f");

d3.json("data.json", function (error, json) {
    if (error)
        return console.warn(error);
    pgData = json;

    nodeData = pgData.graph.nodes;
    edgeData = pgData.graph.edges;

    processGraph();

});

function barChart() {
    var scene = d3.select('a-scene');

    var weightExtent = d3.extent(nodeData, function (d) {
        return d.weight;
    });

    var colorBlue = d3.scaleLinear()
        .domain(weightExtent)
        .interpolate(d3.interpolateHcl)
        .range([d3.rgb(lightBlue), d3.rgb(darkBlue)]);

    var barScale = d3.scaleLinear()
        .domain(weightExtent)
        .range([0, 1]);

    scene.append("a-entity")
        .attr("mixin", "graph-parent")
        .attr("class", "graph")
        .attr("id", "bar-graph")
        .attr("position", "1.4 1 0")
        .attr("look-at", "0 1.6 0");;

    var graph = scene.select("#bar-graph");

    var weights = [];

    nodeData.sort(function (x, y) {
        return d3.ascending(x.weight, y.weight);
    })

    var bars = graph.selectAll("#bars")
        .data(nodeData)
        .enter()
        .append("a-entity")
        .attr("mixin", "node-element")
        .attr("class", "bar")
        .attr("id", d => ('b' + d.nodeid))
        //Normal GEO
        .attr('geometry', d => ('height: ' + 0.05 + ' ; width: ' + barScale(d.weight)))
        //BEZIER TEST GEO
        //.attr('geometry', d => ('height: ' + 1 + ' ; width: ' + 1))
        .attr("material", d => ("color: " + colorBlue(d.weight)))
        .attr('text', d => ('value: ' + d.name + "; color: " + getTextColor(colorBlue(d.weight)) + "; width: 0.7; lineHeight: 52;"))
        .attr("position", function (d, index) {
            return (barScale(d.weight) / 2) - 0.5 + " " + (index * 0.05) + " 0"
        });

}

function processGraph() {

    var scene = d3.select('a-scene');

    var nodes = [];
    var edges = [];

    var connectedHeads = [];
    var connectedTails = [];

    var curvyPaths = [];

    let zShift = -0.001;

    //define midpoints

    var centerpointX = pgData.graph.centralpoint.x;
    var centerpointY = pgData.graph.centralpoint.y;

    var maxX = d3.max(nodeData, function (d) {
        return d.x
    });
    var minX = d3.min(nodeData, function (d) {
        return d.x
    });

    var maxY = d3.max(nodeData, function (d) {
        return d.y
    });
    var minY = d3.min(nodeData, function (d) {
        return d.y
    });

    var radius = 1;
    var depthFactor = 0.4;

    var fixCenterX = d3.scaleLinear()
        .domain([centerpointX, maxX])
        .range([0, maxX - centerpointX]);

    var fixCenterY = d3.scaleLinear()
        .domain([centerpointY, maxY])
        .range([0, maxY - centerpointY]);

    var masterScale = d3.scaleLinear()
        .domain([-400, 0, 400])
        .range([-1, 0, 1]);

    var weightExtent = d3.extent(nodeData, function (d) {
        return d.weight;
    });

    var depthScale = d3.scaleLinear()
        .domain(weightExtent)
        .range([-depthFactor, 0]);

    let lineWidthExtent = d3.extent(edgeData, function (d) {
        return d.weight
    });

    readScale = d3.scaleLinear()
        .domain(weightExtent)
        .range([1.4, 1]);

    var lineWidthScale = d3.scaleLinear()
        .domain(lineWidthExtent)
        .range([3, 20]);

    var colorBlue = d3.scaleLinear()
        .domain(weightExtent)
        .interpolate(d3.interpolateHcl)
        .range([d3.rgb(lightBlue), d3.rgb(darkBlue)]);

    var colorGold = d3.scaleLinear()
        .domain(weightExtent)
        .interpolate(d3.interpolateHcl)
        .range([d3.rgb(lightGold), d3.rgb(darkGold)]);

    scene.append("a-entity")
        .attr("mixin", "graph-parent")
        .attr("class", "graph")
        .attr("id", "process-graph")
        .attr("position", "0 " + 1.6 + " 0");

    var graph = scene.select("#process-graph");

    var nodes = graph.selectAll("#nodes")
        .data(nodeData)
        .enter()
        .append("a-entity")
        .attr("mixin", "node-parent")
        .attr("class", "node-parent")
        .attr("id", d => ('p' + d.nodeid))
        .attr("position", function (d, index) {

            //populate connected heads and tails as hack.. probably needs a fix
            connectedTails[index] = edges.filter(function (eD) {
                return eD.tail == d.name
            });
            connectedHeads[index] = edges.filter(function (eD) {
                return eD.head == d.name
            });
            // CRITICAL. Must use spherical coordinate space
            var x = masterScale(fixCenterX(d.x));
            var y = masterScale(fixCenterY(d.y)) / 2;
            var sphericalPos = new THREE.Spherical(radius, y + (Math.PI / 1.8), x + Math.PI);

            var cartesianPos = new THREE.Vector3();
            cartesianPos.setFromSpherical(sphericalPos);
            /*console.log({
                x,
                y,
                sphericalPos,
                cartesianPos
            });*/
            return cartesianPos.x + ' ' + cartesianPos.y + ' ' + cartesianPos.z
        })
        .append("a-entity")
        .attr("mixin", "node-element")
        .attr("class", "node")
        .attr("id", d => ('n' + d.nodeid))
        //Normal GEO
        .attr('geometry', d => ('height: ' + masterScale(d.h) / 2 + ' ; width: ' + masterScale(d.w)))
        //BEZIER TEST GEO
        //.attr('geometry', d => ('height: ' + 1 + ' ; width: ' + 1))
        .attr("material", d => ("color: " + colorBlue(d.weight)))
        .attr('text', d => ('value: ' + d.name + "; color: " + getTextColor(colorBlue(d.weight)) + "; width: 0.7; lineHeight: 52;"))
        .attr("position", d => ("0 0 " + depthScale(d.weight)))
        .attr("scale", d => (readScale(d.weight) + " " + readScale(d.weight) + " 1"));

    nodes
        .attr("animation__selectpos", d => ("from: 0 0 " + depthScale(d.weight) + "; to: 0 0 0.5"))
        .attr("animation__deselectpos", d => ("from: 0 0 0.5; to: 0 0 " + depthScale(d.weight) + ";"))
        .attr("animation__selectheight", d => ("from: " + masterScale(d.h) / 2 + "; to: " + masterScale(d.h) * 2 + ";"))
        .attr("animation__deselectheight", d => ("from: " + masterScale(d.h) * 2 + "; to: " + masterScale(d.h) / 2 + ";"))
        .attr("animation__deselectscale", d => ("from: 1 1 1; to: " + readScale(d.weight) + " " + readScale(d.weight) + " 1"))
        .attr("animation__selectscale", d => ("from: " + readScale(d.weight) + " " + readScale(d.weight) + " 1; to: 1 1 1;"));

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
            return lineWidthScale(d.weight)
        })
        .attr('linewidthstyler', 1)
        //.attr('linewidth', '100')

        .attr('path', function (d, index) {

            var curvy_pathString = '';
            var tP = [];
            var p = d.controlpoints;
            let numberOfPoints = ((p.length - 1) / 3) + 1;
            let numberOfCurves = ((p.length - 1) / 3);

            var fromN = nodeData.find(x => x.nodeid === d.fromnode);
            var fromX = masterScale(fixCenterX(fromN.x));
            var fromY = masterScale(fixCenterY(fromN.y)) / 2;
            var fromSpherical = new THREE.Spherical(depthScale(fromN.weight), fromY + (Math.PI / 1.8), fromX + Math.PI);

            var toN = nodeData.find(x => x.nodeid === d.tonode);
            var toX = masterScale(fixCenterX(toN.x));
            var toY = masterScale(fixCenterY(toN.y)) / 2;
            var toSpherical = new THREE.Spherical(depthScale(toN.weight), toY + (Math.PI / 1.8), toX + Math.PI);

            var fromWidth = masterScale(fromN.w);
            var toWidth = masterScale(toN.w);


            console.log(fromSpherical.radius, toSpherical.radius);

            for (let i = 0; i < numberOfCurves; i++) {
                let j = i * 3;
                let bezierControlPoints = [];
                for (let k = 0; k < 4; k++) {

                    var x = masterScale(fixCenterX(p[k + j].x));
                    var y = masterScale(fixCenterY(p[k + j].y)) / 2;
                    var sphericalPos = new THREE.Spherical(radius, y + (Math.PI / 1.8), x + Math.PI);
                    bezierControlPoints[k] = new THREE.Vector3();
                    bezierControlPoints[k].setFromSpherical(sphericalPos);

                }
                var bezier = new THREE.CubicBezierCurve3(bezierControlPoints[0], bezierControlPoints[1], bezierControlPoints[2], bezierControlPoints[3]);
                var points = bezier.getSpacedPoints(500);
                //points.pop();
                tP.push(...points);
            }

            let curvyCoords = [];
            var renderCurve = new THREE.CatmullRomCurve3();
            renderCurve.points = tP;
        
            let length = renderCurve.getLength();
            console.log("length", length*numberOfCurves);

            var tP = renderCurve.getSpacedPoints(length*200);

            var stepsize = 1 / tP.length;

            for (let i = 0; i < tP.length; i++) {
                var cartesian = new THREE.Vector3(tP[i].x, tP[i].y, tP[i].z);
                var spherical = new THREE.Spherical();
                spherical.setFromVector3(cartesian);
                spherical.radius -= THREE.Math.lerp(fromSpherical.radius, toSpherical.radius, stepsize * i);
                //spherical.phi -= THREE.Math.lerp(fromSpherical.phi, toSpherical.phi, stepsize * i);
                //spherical.theta -= THREE.Math.lerp(fromSpherical.theta, toSpherical.theta, stepsize * i);
                cartesian.setFromSpherical(spherical);
                tP[i].x = cartesian.x;
                tP[i].y = cartesian.y;
                tP[i].z = cartesian.z;
            }

            for (let i = 0; i < tP.length - 10; i++) {
                curvy_pathString += tP[i].x + ' ' + tP[i].y + ' ' + tP[i].z + ', ';
            }
            curvy_pathString += tP[tP.length - 9].x + ' ' + tP[tP.length - 9].y + ' ' + tP[tP.length - 9].z;
            curvyPaths[index] = curvy_pathString;
            addTriangle(this, d, tP[tP.length - 9], tP[tP.length - 1]);
            return curvy_pathString;
        })
        .on("select", function (d) {
            setColor(this, d, colorGold(d.weight));
        })
        .on("deselect", function (d) {
            setColor(this, d, colorBlue(d.weight));
        });

    function addTriangle(el, d, first, second) {
        
        d3.select(el).append("a-jline")
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
            return lineWidthScale(d.weight)*3
        })
        .attr('linewidthstyler', "1-p")
        //.attr('linewidth', '100')
        .attr("path", makeStringFromVectors(first, second))
        .on("select", function (d) {
            setColor(this, d, colorGold(d.weight));
        })
        .on("deselect", function (d) {
            setColor(this, d, colorBlue(d.weight));
        });;
    }
    
    function makeStringFromVectors(a, b){
        return a.x + " " + a.y + " " + a.z + ", " + b.x + " " + b.y + " " + b.z;
    }
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
