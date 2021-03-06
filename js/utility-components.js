var debug = AFRAME.utils.debug;
var coordinates = AFRAME.utils.coordinates;

AFRAME.registerComponent('node-object', {
    schema: {
        width: {
            type: 'number',
            default: 1
        },
        height: {
            type: 'number',
            default: 1
        },
        depth: {
            type: 'number',
            default: 1
        },
        color: {
            type: 'color',
            default: '#AAA'
        }
    },

    /**
     * Initial creation and setting of the mesh.
     */
    init: function () {
        var data = this.data;
        var el = this.el;

        // Create geometry.
        this.geometry = new THREE.PlaneGeometry(data.width, data.height);

        // Create material.
        this.material = new THREE.MeshStandardMaterial({
            color: data.color,
            side: THREE.DoubleSide
        });

        // Create mesh.
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        // Set mesh on entity.

        this.forcegraphComponent = el.components.forcegraph;

        this.links = this.forcegraphComponent.data.links;
        this.nodes = this.forcegraphComponent.data.nodes;

        this.xMax = d3.max(this.nodes, function (d) {
            console.log(d.name + " " + d.x);
            return d.x;
        });
        this.yMax = d3.max(this.nodes, function (d) {
            console.log(d.name + " " + d.y);
            return d.y;
        })
        this.yMin = d3.min(this.nodes, function (d) {
            console.log(d.name + " " + d.y);
            return d.y;
        });


        //Function that takes nodeData, finds absolute max distance from center
        //creates scale that aligns all data around centerpoint

        this.xScale = d3.scaleLinear()
            .domain([0, this.xMax])
            .range([0, 8000]);
        this.yScale = d3.scaleLinear()
            .domain([this.yMin, this.yMax])
            .range([4000, 300]);
    },
    update: function () {
        var forcegraphComponent = this.forcegraphComponent;
        var el = this.el;

        console.log(this.links);

        AFRAME.utils.entity.setComponentProperty(el, 'forcegraph.nodeThreeObject', this.mesh);
        forcegraphComponent.d3Force("x", d3.forceX().x(d => this.xScale(d.x)).strength(1));
        forcegraphComponent.d3Force("y", d3.forceY().y(d => this.yScale(d.y)).strength(1));

        try {
            forcegraphComponent.d3Force("link", d3.forceLink(this.links).id(d => d.id).distance(d => 1 / d.weight));
        } catch (e) {
            console.log(e);
        }

        forcegraphComponent.d3Force('charge', d3.forceManyBody().strength(5));
    }
});

var warn = debug('components:look-at-fixed-height:warn');
var isCoordinates = coordinates.isCoordinates;

delete AFRAME.components['look-at-fixed-height'];

/**
 * Look-at component.
 *
 * Modifies rotation to either track another entity OR do a one-time turn towards a position
 * vector.
 *
 * If tracking an object via setting the component value via a selector, look-at will register
 * a behavior to the scene to update rotation on every tick.
 */
AFRAME.registerComponent('look-at-fixed-height', {
    schema: {
        default: '',

        parse: function (value) {
            // A static position to look at.
            if (isCoordinates(value) || typeof value === 'object') {
                return coordinates.parse(value);
            }
            // A selector to a target entity.
            return value;
        },

        stringify: function (data) {
            if (typeof data === 'object') {
                //console.log(data);
                return coordinates.stringify(data);
            }
            //console.log(data);
            return data;
        }
    },

    init: function () {
        this.target3D = null;
        this.vector = new THREE.Vector3();
    },

    /**
     * If tracking an object, this will be called on every tick.
     * If looking at a position vector, this will only be called once (until further updates).
     */
    update: function () {
        var self = this;
        var target = self.data;
        var object3D = self.el.object3D;
        var targetEl;

        // No longer looking at anything (i.e., look-at="").
        if (!target || (typeof target === 'object' && !Object.keys(target).length)) {
            return self.remove();
        }

        // Look at a position.
        if (typeof target === 'object') {
            return object3D.lookAt(new THREE.Vector3(target.x, target.y, target.z));
        }

        // Assume target is a string.
        // Query for the element, grab its object3D, then register a behavior on the scene to
        // track the target on every tick.
        targetEl = self.el.sceneEl.querySelector(target);
        if (!targetEl) {
            warn('"' + target + '" does not point to a valid entity to look-at');
            return;
        }
        if (!targetEl.hasLoaded) {
            return targetEl.addEventListener('loaded', function () {
                self.beginTracking(targetEl);
            });
        }
        return self.beginTracking(targetEl);
    },

    tick: (function () {
        var vec3 = new THREE.Vector3();

        return function (t) {
            // Track target object position. Depends on parent object keeping global transforms up
            // to state with updateMatrixWorld(). In practice, this is handled by the renderer.
            var target;
            var target3D = this.target3D;
            var object3D = this.el.object3D;
            var vector = this.vector;

            if (target3D) {
                object3D.parent.worldToLocal(target3D.getWorldPosition(vec3));
                if (this.el.getObject3D('camera')) {
                    // Flip the vector to -z, looking away from target for camera entities. When using
                    // lookat from THREE camera objects, this is applied for you, but since the camera is
                    // nested into a Object3D, we need to apply this manually.
                    vector.subVectors(object3D.position, vec3).add(object3D.position);
                } else {
                    vector = vec3;
                }
                vector.y = object3D.position.y;
                object3D.lookAt(vector);
            }
        };
    })(),

    beginTracking: function (targetEl) {
        this.target3D = targetEl.object3D;
    }
});


var warn = debug('components:look-at-bounds:warn');
var isCoordinates = coordinates.isCoordinates;

delete AFRAME.components['look-at-bounds'];

/**
 * Look-at component.
 *
 * Modifies rotation to either track another entity OR do a one-time turn towards a position
 * vector.
 *
 * If tracking an object via setting the component value via a selector, look-at will register
 * a behavior to the scene to update rotation on every tick.
 */
AFRAME.registerComponent('look-at-bounds', {
    schema: {
        default: '',

        parse: function (value) {
            // A static position to look at.
            if (isCoordinates(value) || typeof value === 'object') {
                return coordinates.parse(value);
            }
            // A selector to a target entity.
            return value;
        },

        stringify: function (data) {
            if (typeof data === 'object') {
                //console.log(data);
                return coordinates.stringify(data);
            }
            //console.log(data);
            return data;
        }
    },

    init: function () {
        this.target3D = null;
        this.vector = new THREE.Vector3();
    },

    /**
     * If tracking an object, this will be called on every tick.
     * If looking at a position vector, this will only be called once (until further updates).
     */
    update: function () {
        var self = this;
        var target = self.data;
        var object3D = self.el.object3D;
        var targetEl;

        // No longer looking at anything (i.e., look-at="").
        if (!target || (typeof target === 'object' && !Object.keys(target).length)) {
            return self.remove();
        }

        // Look at a position.
        if (typeof target === 'object') {
            return object3D.lookAt(new THREE.Vector3(target.x, target.y, target.z));
        }

        // Assume target is a string.
        // Query for the element, grab its object3D, then register a behavior on the scene to
        // track the target on every tick.
        targetEl = self.el.sceneEl.querySelector(target);
        if (!targetEl) {
            warn('"' + target + '" does not point to a valid entity to look-at');
            return;
        }
        if (!targetEl.hasLoaded) {
            return targetEl.addEventListener('loaded', function () {
                self.beginTracking(targetEl);
            });
        }
        return self.beginTracking(targetEl);
    },

    tick: (function () {
        var vec3 = new THREE.Vector3();

        return function (t) {
            // Track target object position. Depends on parent object keeping global transforms up
            // to state with updateMatrixWorld(). In practice, this is handled by the renderer.
            var target;
            var target3D = this.target3D;
            var object3D = this.el.object3D;
            var vector = this.vector;

            if (target3D) {
                object3D.parent.worldToLocal(target3D.getWorldPosition(vec3));
                if (this.el.getObject3D('camera')) {
                    // Flip the vector to -z, looking away from target for camera entities. When using
                    // lookat from THREE camera objects, this is applied for you, but since the camera is
                    // nested into a Object3D, we need to apply this manually.
                    vector.subVectors(object3D.position, vec3).add(object3D.position);
                } else {
                    vector = vec3;
                }
                vector.y *= 5;
                object3D.lookAt(vector.divideScalar(5));
            }
        };
    })(),

    beginTracking: function (targetEl) {
        this.target3D = targetEl.object3D;
    }
});


var warn = debug('components:dynamic-positionality');
var isCoordinates = coordinates.isCoordinates;

delete AFRAME.components['dynamic-positionality'];

/**
 * Look-at component.
 *
 * Modifies rotation to either track another entity OR do a one-time turn towards a position
 * vector.
 *
 * If tracking an object via setting the component value via a selector, look-at will register
 * a behavior to the scene to update rotation on every tick.
 */
AFRAME.registerComponent('dynamic-positionality', {
    schema: {
        radius: {
            type: "float"
        }
    },
    init: function () {
        this.target3D = null;
        this.trackingVector = new THREE.Vector3();
        this.worldVector = new THREE.Vector3();
    },
    update: function () {
        var self = this;
        var targetEl = self.el.sceneEl.querySelector('[camera]');
        if (!targetEl) {
            warn('"' + target + '" does not point to a valid entity to look-at');
            return;
        }
        if (!targetEl.hasLoaded) {
            return targetEl.addEventListener('loaded', function () {
                self.beginTracking(targetEl);
            });
        }
        return self.beginTracking(targetEl);
    },
    tick: (function () {
        return function (t) {
            // Track target object position. Depends on parent object keeping global transforms up
            // to state with updateMatrixWorld(). In practice, this is handled by the renderer.
            var target;
            var target3D = this.target3D;
            var object3D = this.el.object3D;
            var parentPosition = object3D.parent.position;
            var trackingVector = this.trackingVector;
            var worldVector = this.worldVector

            if (target3D) {
                object3D.parent.worldToLocal(target3D.getWorldPosition(worldVector));
                trackingVector = worldVector;
                var distance = parentPosition.distanceTo(trackingVector);
                var desiredZ = THREE.Math.clamp((1.6 - distance), 0, 1.6);
                object3D.position.z = -desiredZ;
            }
        };
    })(),
    beginTracking: function (targetEl) {
        this.target3D = targetEl.object3D;
    }
});

AFRAME.registerComponent('selectable', {
    schema: {
        state: {
            type: "boolean"
        }
    },
    init: function () {
        var self = this;
        this.initialPos = self.el.getAttribute('position');
    },
    update: function (oldData) {

        var data = this.data;
        var el = this.el;

        if (data.state !== oldData.state) {
            if (data.state) {
                el.object3D.position.z = 0.1;
            } else {
                el.object3D.position = this.initialPos;
            }
        }
    }

});

AFRAME.registerComponent('plane-helper', {
    init: function () {
        var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1).normalize(), 0.1);
        this.el.setObject3D('helper', new THREE.PlaneHelper(plane, 1, 0xffff00));
    }
});

AFRAME.registerComponent('desktop-only', {
    tick: function () {
        var entity = this.el;
        if (AFRAME.utils.device.checkHeadsetConnected()) {
            if (!AFRAME.utils.device.isMobile()) {
                entity.parentNode.removeChild(entity);
            }
        }
    }
});

AFRAME.registerComponent('vr-only', {
    tick: function () {
        var entity = this.el;
        if (!AFRAME.utils.device.checkHeadsetConnected()) {
            entity.parentNode.removeChild(entity);
        }
    }
});

AFRAME.registerComponent('6dof-only', {
    tick: function () {
        var entity = this.el;
        if (!AFRAME.utils.device.checkHeadsetConnected()) {
            entity.parentNode.removeChild(entity);
        }
        else if (AFRAME.utils.device.isMobile()) {
            entity.parentNode.removeChild(entity);
        }
    }
});
