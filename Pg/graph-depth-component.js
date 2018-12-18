AFRAME.registerComponent('graph-depth', {
    schema: {
        state: {
            type: "float"
        }
    },
    init: function () {
        var self = this;
        var sceneEl = document.querySelector('a-scene');
        this.children = sceneEl.querySelectorAll('.node');
    },
    update: function (oldData) {
        //console.log(this.children);
        
    }

});