var json = demo.json;

function restruct(arr) {
    var result = {};

    arr.forEach(function (obj) {
        if (obj.children) {
            obj.children = restruct(obj.children);
        }

        result[obj.id] = obj;
    });
    return result;
}
console.log(json);
console.log(restruct(json));