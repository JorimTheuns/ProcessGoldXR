AFRAME.registerComponent('traces', {
    schema: {
        fromNode: {
            default: ''
        },
        toNode: {
            default: ''
        }
    },
    init: function () {
        this.from3D = null;
        this.to3D = null;
        this.fromPlane = null;
        this.toPlane = null;
        this.fromNormal = new THREE.Vector3();
        this.toNormal = new THREE.Vector3();
        this.fromWorldVector = new THREE.Vector3();
        this.toWorldVector = new THREE.Vector3();
        this.intersectVect = new THREE.Vector3();
        this.crossVect = new THREE.Vector3();
        
        this.target3D = null;
        this.trackingVector = new THREE.Vector3();
        this.worldVector = new THREE.Vector3();
        
        this.el.setObject3D('line-helper', new THREE.PlaneHelper( plane, 1, 0xffff00 ));
        
        this.tick = AFRAME.utils.throttleTick(this.tick, 500, this);
    },
    update: function () {
        var self = this;
        var from = self.data.fromNode;
        var to = self.data.toNode;
        var graph = document.querySelector(".graph");
        var fromEl = graph.querySelector(from);
        var toEl = graph.querySelector(to);
        var targetEl = self.el.sceneEl.querySelector('[camera]');

        if (!fromEl) {
            console.log('"' + from + '" does not point to a valid entity');
            return;
        }
        if (!toEl) {
            console.log('"' + to + '" does not point to a valid entity');
            return;
        }
        if (!targetEl) {
            warn('"' + target + '" does not point to a valid entity to look-at');
            return;
        }
        if (!targetEl.hasLoaded) {
            return targetEl.addEventListener('loaded', function () {
                self.camReady(targetEl, fromEl, toEl);
            });
        }
        if (!fromEl.hasLoaded) {
            return fromEl.addEventListener('loaded', function () {
                self.fromReady(targetEl, fromEl, toEl);
            });
        }
        if (!toEl.hasLoaded) {
            return toEl.addEventListener('loaded', function () {
                self.beginDraw(targetEl, fromEl, toEl);
            });
        }
        self.beginDraw(targetEl, fromEl, toEl);
    },
    tick: (function () {

        return function (t, dt) {
            // Track from and to object position. Depends on parent object keeping global transforms up
            // to state with updateMatrixWorld(). In practice, this is handled by the renderer.
            var target;
            var target3D = this.target3D;
            var object3D = this.el.object3D;
            var parentPosition = object3D.parent.position;
            var trackingVector = this.trackingVector;
            var worldVector = this.worldVector
            
            var crossVect = this.crossVect;
            
            var from3D = this.from3D;
            var to3D = this.to3D;

            var fromWorldVector = this.fromWorldVector;
            var toWorldVector = this.toWorldVector;
            var fromNormal = this.fromNormal;
            var toNormal = this.toNormal;
            var fromPlane = this.fromPlane;
            var toPlane = this.toPlane;

            if (target3D && from3D && to3D) {
                
                object3D.parent.worldToLocal(target3D.getWorldPosition(worldVector));
                trackingVector = worldVector;
                
                object3D.parent.worldToLocal(from3D.getWorldPosition(fromWorldVector));
                object3D.parent.worldToLocal(to3D.getWorldPosition(toWorldVector));
                
                from3D.getWorldDirection(fromNormal);
                to3D.getWorldDirection(toNormal);
                
                crossVect.crossVectors(fromNormal, toNormal);
                
                console.log("cross product: " + coordinates.stringify(crossVect));
                
                fromNormal.subVectors(trackingVector, fromWorldVector);
                toNormal.subVectors(trackingVector, toWorldVector);
                
                var distance = fromWorldVector.distanceTo(toWorldVector);
                
                console.log(fromPlane);
                
                //console.log("from normal: " + coordinates.stringify(fromPlane.normal));
                //console.log("to normal: " + coordinates.stringify(toPlane.normal));
                //console.log("from: " + from3D.el.id + ": " + coordinates.stringify(fromWorldVector) + " to " + to3D.el.id + ": " + coordinates.stringify(toWorldVector) + " is " + distance);
            }
        };
    })(),
    camReady: function (targetEl, fromEl, toEl) {
        if (!fromEl.hasLoaded) {
            return fromEl.addEventListener('loaded', function () {
                self.fromReady(targetEl, fromEl, toEl);
            });
        }
    },
    fromReady: function (targetEl, fromEl, toEl) {
        if (!toEl.hasLoaded) {
            return toEl.addEventListener('loaded', function () {
                self.beginDraw(targetEl, fromEl, toEl);
            });
        }
    },
    beginDraw: function (targetEl, fromEl, toEl) {
        this.target3D = targetEl.object3D;
        this.from3D = fromEl.object3D;
        this.to3D = toEl.object3D;
        this.fromPlane = fromEl.getObject3D('helper').plane;
        this.toPlane = toEl.getObject3D('helper').plane;
    }
});
