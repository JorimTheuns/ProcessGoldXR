var json = demo.json;

function restruct(demo) {
    var result = {};
	var nodes = demo.graph.nodes;
	var nodes = demo.graph.edges;

for (var i=0; i<nodes[i]; i++) {
    var id = nodes[i].nodeid,
        name = nodes[i].name;
    result.nodes[i].push(id);
	result.nodes[i].push(name);
}
for (var i=0; i<edges[i]; i++) {
    var id = edges[i].nodeid,
        name = edges[i].name;
    result.edges[i].push(id);
	result.edges[i].push(name);
}
}
console.log(json);
console.log(restruct(json));