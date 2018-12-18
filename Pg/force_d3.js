d3.json("data.json", function (error, json) {
    if (error)
        return console.warn(error);
    pgData = json;
    visualise();
});

function visualise() {

    var scene = d3.select('a-scene');

    var nodeData = pgData.graph.nodes;
    var edgeData = pgData.graph.edges;

    scene.append("a-entity")
        .attr("mixin", "graph-parent")
        .attr("class", "graph")
        .attr("id", "process-graph")
        .attr("position", "0 " + 1.6 + " 0")
        .attr("scale", "0.01 0.01 0.01")
        .attr("forcegraph", "nodes: " + JSON.stringify(nodeData) + "; links: " + JSON.stringify(edgeData) + ";");
}
