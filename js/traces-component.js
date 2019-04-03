AFRAME.registerComponent('traces', {
    schema: {
        fromNode: {
            default: ''
        },
        toNode: {
            default: ''
        },
        controlPoints: {
            parse: JSON.parse,
            stringify: JSON.stringify
        },
        catmull: {
            default: 'true'
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
        this.fromWorldSpherical = new THREE.Spherical();
        this.toWorldSpherical = new THREE.Spherical();

        if (this.data.catmull) {
            this.path = new THREE.CatmullRomCurve3();
        } else {
            this.path = new THREE.CurvePath();
        }


        this.intersectVect = new THREE.Vector3();
        this.crossVect = new THREE.Vector3();

        this.curvePath = [];

        this.helperArray = [];

        this.helperGeometry = new THREE.BoxBufferGeometry(0.01, 0.01, 0.01);

        // Create material.
        this.helperMaterial = new THREE.MeshStandardMaterial({
            color: "#00ff00"
        });

        this.lineMaterial = new THREE.LineBasicMaterial({
            color: 0xff0000
        });

        // Create mesh.

        // Set mesh on entity.

        this.target3D = null;
        this.trackingVector = new THREE.Vector3();
        this.worldVector = new THREE.Vector3();

        this.tick = AFRAME.utils.throttleTick(this.tick, 500, this);
    },
    update: function () {
        var self = this;
        var el = this.el;
        var from = self.data.fromNode;
        var to = self.data.toNode;
        var curve = self.data.controlPoints;
        var path = this.path;
        var graph = document.querySelector(".graph");
        var fromEl = graph.querySelector(from);
        var toEl = graph.querySelector(to);
        var targetEl = self.el.sceneEl.querySelector('[camera]');
        var curveArray = this.curveArray;
        var curvePath = this.curvePath;
        var helperArray = this.helperArray;
        var helperMaterial = this.helperMaterial;
        var helperGeometry = this.helperGeometry;
        var object3D = this.el.object3D;
        var fromWorldVector = this.fromWorldVector;
        var toWorldVector = this.toWorldVector;
        var fromWorldSpherical = this.fromWorldSpherical;
        var toWorldSpherical = this.toWorldSpherical;

        fromEl.object3D.parent.getWorldPosition(fromWorldVector);
        fromWorldSpherical.setFromVector3(fromWorldVector);
        var pos = fromEl.object3D.position;
        //console.log(pos);
        fromWorldSpherical.radius -= pos.z;
        //console.log("from Spherical");
        //console.log(fromWorldSpherical);

        toEl.object3D.parent.getWorldPosition(toWorldVector);
        toWorldSpherical.setFromVector3(toWorldVector);
        var pos = toEl.object3D.position;
        //console.log(pos);
        toWorldSpherical.radius -= pos.z;
        //console.log("to Spherical");
        //console.log(toWorldSpherical);
        //console.log(stepsize);

        path.fromJSON(curve);

        console.log(path);

        curvePath = path.getPoints(50);

        var length = curvePath.length;
        var stepsize = 1 / length;

        for (let i = 0; i < length-1; i++) {
            helperArray[i] = document.createElement('a-entity');
            helperArray[i].setObject3D('mesh', new THREE.Mesh(helperGeometry, helperMaterial));

            var desiredZ = THREE.Math.lerp(fromWorldSpherical.radius, toWorldSpherical.radius, stepsize * i);
            var spherical = new THREE.Spherical().setFromVector3(curvePath[i]);
            spherical.radius = desiredZ;
            //console.log(spherical);
            helperArray[i].object3D.position.setFromSpherical(spherical);
            el.appendChild(helperArray[i]);
        }

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
        //self.beginDraw(targetEl, fromEl, toEl);
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
    }
});
