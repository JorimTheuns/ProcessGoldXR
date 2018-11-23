/* global AFRAME */
var styleParser = AFRAME.utils.styleParser;

if (typeof AFRAME === 'undefined') {
    throw new Error('Component attempted to register before AFRAME was available.');
}

AFRAME.registerComponent('nodemousebehaviour', {
    schema: {
        entercolor: {
            default: ''
        },
        enterscale: {
            default: ''
        },
        downcolor: {
            default: ''
        },
        downscale: {
            default: ''
        },
        upcolor: {
            default: ''
        },
        upscale: {
            default: ''
        },
        leavecolor: {
            default: ''
        },
        leavescale: {
            default: ''
        }
    },

    init: function () {},

    update: function (oldData) {
        this.removeEventListeners();
        this.updateEventListeners();
        this.addEventListeners();
    },

    remove: function () {
        this.removeEventListeners();
    },

    pause: function () {
        this.removeEventListeners();
    },

    play: function () {
        this.addEventListeners();
    },

    /**
     * Update source-of-truth event listener registry.
     * Does not actually attach event listeners yet.
     */
    updateEventListeners: function () {
        var data = this.data;
        var el = this.el;
        var sceneEl = document.querySelector('a-scene');
        var downed = false;

        this.entereventHandler = function enterhandler() {
            console.log('mouse entered: ' + data.entercolor);
            AFRAME.utils.entity.setComponentProperty(el, 'material.color', data.entercolor);
            AFRAME.utils.entity.setComponentProperty(el, 'scale', data.enterscale);

            var name = AFRAME.utils.entity.getComponentProperty(el, 'id');
            name = '.' + name;
            console.log(name);
            var edges = sceneEl.querySelectorAll(name);
            for (var i = 0; i < edges.length; i++) {
                edges[i].emit("select");
            }
        };
        this.downeventHandler = function downhandler() {
            downed = true;
            console.log('mouse down: ' + data.downcolor);
            AFRAME.utils.entity.setComponentProperty(el, 'material.color', data.downcolor);
            AFRAME.utils.entity.setComponentProperty(el, 'scale', data.downscale);
        };
        this.upeventHandler = function uphandler() {
            if (downed) {
                console.log('mouse up: ' + data.upcolor);
                AFRAME.utils.entity.setComponentProperty(el, 'material.color', data.upcolor);
                AFRAME.utils.entity.setComponentProperty(el, 'scale', data.upscale);
                downed = false;
            }
        };
        this.leaveeventHandler = function leavehandler() {
            downed = false;
            console.log('mouse left: ' + data.leavecolor);
            AFRAME.utils.entity.setComponentProperty(el, 'material.color', data.leavecolor);
            AFRAME.utils.entity.setComponentProperty(el, 'scale', data.leavescale);
            var name = AFRAME.utils.entity.getComponentProperty(el, 'id');
            name = '.' + name;
            var edges = sceneEl.querySelectorAll(name);
            for (var i = 0; i < edges.length; i++) {
                edges[i].emit("deselect");
            }
        };
    },

    addEventListeners: function () {
        this.el.addEventListener('mouseenter', this.entereventHandler);
        this.el.addEventListener('mousedown', this.downeventHandler);
        this.el.addEventListener('mouseup', this.upeventHandler);
        this.el.addEventListener('mouseleave', this.leaveeventHandler);
    },

    removeEventListeners: function () {
        this.el.removeEventListener('mouseenter', this.entereventHandler);
        this.el.removeEventListener('mousedown', this.downeventHandler);
        this.el.removeEventListener('mouseup', this.upeventHandler);
        this.el.removeEventListener('mouseleave', this.leaveeventHandler);
    }
});

AFRAME.registerComponent('nodeselectbehaviour', {
    schema: {
        text: {
            default: 'text'
        },
        selecttext: {
            default: 'select'
        },
        textcolor: {
            default: '#ffffff'
        },
        height: {
            default: 0.09
        },
        selectheight: {
            default: 0.45
        },
        width: {
            default: 0.09
        },
        selectwidth: {
            default: 0.45
        },
        animateDepth: {
            default: false
        }
    },

    init: function () {},

    update: function (oldData) {
        this.removeEventListeners();
        this.updateEventListeners();
        this.addEventListeners();
    },

    remove: function () {
        this.removeEventListeners();
    },

    pause: function () {
        this.removeEventListeners();
    },

    play: function () {
        this.addEventListeners();
    },

    /**
     * Update source-of-truth event listener registry.
     * Does not actually attach event listeners yet.
     */
    updateEventListeners: function () {
        var data = this.data;
        var el = this.el;
        var downed = false;


        this.entereventHandler = function enterhandler() {};
        this.downeventHandler = function downhandler() {
            downed = true;
            var oldPos = AFRAME.utils.entity.getComponentProperty(el, 'position');
            var newPos;
            if (data.animateDepth) {
                oldPos.y -= 1.5;
                newPos = oldPos;
                newPos.x -= oldPos.x / 21;
                newPos.y -= oldPos.y / 21;
                newPos.z -= oldPos.z / 21;
                newPos.y += 1.5;
            } else {
                newPos = oldPos;
                newPos.z -= oldPos.z / 51;
            }
            AFRAME.utils.entity.setComponentProperty(el, 'position', newPos);

            AFRAME.utils.entity.setComponentProperty(el, 'geometry.height', data.selectheight);

            AFRAME.utils.entity.setComponentProperty(el, 'geometry.width', data.selectwidth);

            var oldText = AFRAME.utils.entity.getComponentProperty(el, 'text.value');
            AFRAME.utils.entity.setComponentProperty(el, 'text.value', data.selecttext);
            AFRAME.utils.entity.setComponentProperty(el, 'text.color', "white");
        };
        this.upeventHandler = function uphandle() {
            if (downed) {
                var oldPos = AFRAME.utils.entity.getComponentProperty(el, 'position');
                var newPos;
                if (data.animateDepth) {
                    oldPos.y -= 1.5;
                    newPos = oldPos;
                    newPos.x += oldPos.x / 20;
                    newPos.y += oldPos.y / 20;
                    newPos.z += oldPos.z / 20;
                    newPos.y += 1.5;
                } else {
                    newPos = oldPos;
                    newPos.z += oldPos.z / 50;
                }
                AFRAME.utils.entity.setComponentProperty(el, 'position', newPos);
                AFRAME.utils.entity.setComponentProperty(el, 'geometry.height', data.height);
                AFRAME.utils.entity.setComponentProperty(el, 'geometry.width', data.width);
                AFRAME.utils.entity.setComponentProperty(el, 'text.value', data.text);
                var entityColor = AFRAME.utils.entity.getComponentProperty(el, 'material.color');
                console.log(entityColor);
                AFRAME.utils.entity.setComponentProperty(el, 'text.color', data.textcolor);

                downed = false;
            }
        };
        this.leaveeventHandler = function leavehandler() {
            if (downed) {
                var oldPos = AFRAME.utils.entity.getComponentProperty(el, 'position');
                var newPos;
                if (data.animateDepth) {
                    oldPos.y -= 1.5;
                    newPos = oldPos;
                    newPos.x += oldPos.x / 20;
                    newPos.y += oldPos.y / 20;
                    newPos.z += oldPos.z / 20;
                    newPos.y += 1.5;
                } else {
                    newPos = oldPos;
                    newPos.z += oldPos.z / 50;
                }
                AFRAME.utils.entity.setComponentProperty(el, 'position', newPos);
                AFRAME.utils.entity.setComponentProperty(el, 'geometry.height', data.height);
                AFRAME.utils.entity.setComponentProperty(el, 'geometry.width', data.width);

                var oldText = AFRAME.utils.entity.getComponentProperty(el, 'text.value');
                AFRAME.utils.entity.setComponentProperty(el, 'text.value', data.text);
                downed = false;
                AFRAME.utils.entity.setComponentProperty(el, 'text.color', data.textcolor);
            }
        };
    },

    addEventListeners: function () {
        this.el.addEventListener('mouseenter', this.entereventHandler);
        this.el.addEventListener('mousedown', this.downeventHandler);
        this.el.addEventListener('mouseup', this.upeventHandler);
        this.el.addEventListener('mouseleave', this.leaveeventHandler);
    },

    removeEventListeners: function () {
        this.el.removeEventListener('mouseenter', this.entereventHandler);
        this.el.removeEventListener('mousedown', this.downeventHandler);
        this.el.removeEventListener('mouseup', this.upeventHandler);
        this.el.removeEventListener('mouseleave', this.leaveeventHandler);
    }
});

AFRAME.registerComponent('labelbehaviour', {
    schema: {
        scale: {
            type: 'boolean'
        }
    },

    init: function () {},

    update: function (oldData) {
        this.removeEventListeners();
        this.updateEventListeners();
        this.addEventListeners();
    },

    remove: function () {
        this.removeEventListeners();
    },

    pause: function () {
        this.removeEventListeners();
    },

    play: function () {
        this.addEventListeners();
    },

    /**
     * Update source-of-truth event listener registry.
     * Does not actually attach event listeners yet.
     */
    updateEventListeners: function () {
        var data = this.data;
        var el = this.el;
        var entered = false;


        this.entereventHandler = function enterhandler() {
            entered = true;
            var oldPos = AFRAME.utils.entity.getComponentProperty(el, 'position');
            oldPos.y -= 1.5;
            var newPos = oldPos;
            newPos.x -= oldPos.x / 11;
            newPos.y -= oldPos.y / 11;
            newPos.z -= oldPos.z / 11;
            newPos.y += 1.5;
            AFRAME.utils.entity.setComponentProperty(el, 'position', newPos);
            console.log("scale is: " + data.scale);
            if (data.scale) {
                AFRAME.utils.entity.setComponentProperty(el, 'scale', '1.5 1.5 1.5');
            }
        };
        this.downeventHandler = function downhandler() {};
        this.upeventHandler = function uphandle() {};
        this.leaveeventHandler = function leavehandler() {
            if (entered) {
                var oldPos = AFRAME.utils.entity.getComponentProperty(el, 'position');
                oldPos.y -= 1.5;
                var newPos = oldPos;
                newPos.x += oldPos.x / 10;
                newPos.y += oldPos.y / 10;
                newPos.z += oldPos.z / 10;
                newPos.y += 1.5;
                AFRAME.utils.entity.setComponentProperty(el, 'position', newPos);
                AFRAME.utils.entity.setComponentProperty(el, 'scale', '1 1 1');
                entered = false;
            }
        };
    },

    addEventListeners: function () {
        this.el.addEventListener('mouseenter', this.entereventHandler);
        this.el.addEventListener('mousedown', this.downeventHandler);
        this.el.addEventListener('mouseup', this.upeventHandler);
        this.el.addEventListener('mouseleave', this.leaveeventHandler);
    },

    removeEventListeners: function () {
        this.el.removeEventListener('mouseenter', this.entereventHandler);
        this.el.removeEventListener('mousedown', this.downeventHandler);
        this.el.removeEventListener('mouseup', this.upeventHandler);
        this.el.removeEventListener('mouseleave', this.leaveeventHandler);
    }
});

AFRAME.registerComponent('labelcolorbehaviour', {
    schema: {
        color: {
            type: 'boolean'
        }
    },

    init: function () {},

    update: function (oldData) {
        this.removeEventListeners();
        this.updateEventListeners();
        this.addEventListeners();
    },

    remove: function () {
        this.removeEventListeners();
    },

    pause: function () {
        this.removeEventListeners();
    },

    play: function () {
        this.addEventListeners();
    },

    /**
     * Update source-of-truth event listener registry.
     * Does not actually attach event listeners yet.
     */
    updateEventListeners: function () {
        var data = this.data;
        var el = this.el;
        var entered = false;
        var downed = false;
        var sceneEl = document.querySelector('a-scene');


        this.entereventHandler = function enterhandler() {
            entered = true;
            var name = AFRAME.utils.entity.getComponentProperty(el, 'id');
            name = '.' + name;
            var edges = sceneEl.querySelectorAll(name);
            for (var i = 0; i < edges.length; i++) {
                edges[i].emit("select");
            }
        };
        this.downeventHandler = function downhandler() {};
        this.upeventHandler = function uphandle() {};
        this.leaveeventHandler = function leavehandler() {
            if (entered) {
                var name = AFRAME.utils.entity.getComponentProperty(el, 'id');
                name = '.' + name;
                var edges = sceneEl.querySelectorAll(name);
                for (var i = 0; i < edges.length; i++) {
                    edges[i].emit("deselect");
                }
                entered = false;
            }
        };
    },

    addEventListeners: function () {
        this.el.addEventListener('mouseenter', this.entereventHandler);
        this.el.addEventListener('mousedown', this.downeventHandler);
        this.el.addEventListener('mouseup', this.upeventHandler);
        this.el.addEventListener('mouseleave', this.leaveeventHandler);
    },

    removeEventListeners: function () {
        this.el.removeEventListener('mouseenter', this.entereventHandler);
        this.el.removeEventListener('mousedown', this.downeventHandler);
        this.el.removeEventListener('mouseup', this.upeventHandler);
        this.el.removeEventListener('mouseleave', this.leaveeventHandler);
    }
});

AFRAME.registerComponent('mouseinteraction', {
    schema: {
        entercolor: {
            default: ''
        },
        enterscale: {
            default: ''
        },
        downcolor: {
            default: ''
        },
        downscale: {
            default: ''
        },
        upcolor: {
            default: ''
        },
        upscale: {
            default: ''
        },
        leavecolor: {
            default: ''
        },
        leavescale: {
            default: ''
        }
    },

    init: function () {},

    update: function (oldData) {
        this.removeEventListeners();
        this.updateEventListeners();
        this.addEventListeners();
    },

    remove: function () {
        this.removeEventListeners();
    },

    pause: function () {
        this.removeEventListeners();
    },

    play: function () {
        this.addEventListeners();
    },

    /**
     * Update source-of-truth event listener registry.
     * Does not actually attach event listeners yet.
     */
    updateEventListeners: function () {
        var data = this.data;
        var el = this.el;
        var sceneEl = document.querySelector('a-scene');
        var downed = false;

        this.entereventHandler = function enterhandler() {
            console.log('mouse entered: ' + data.entercolor);
            AFRAME.utils.entity.setComponentProperty(el, 'material.color', data.entercolor);
            AFRAME.utils.entity.setComponentProperty(el, 'scale', data.enterscale);
        };
        this.downeventHandler = function downhandler() {
            downed = true;
            console.log('mouse down: ' + data.downcolor);
            AFRAME.utils.entity.setComponentProperty(el, 'material.color', data.downcolor);
            AFRAME.utils.entity.setComponentProperty(el, 'scale', data.downscale);
        };
        this.upeventHandler = function uphandler() {
            if (downed) {
                console.log('mouse up: ' + data.upcolor);
                AFRAME.utils.entity.setComponentProperty(el, 'material.color', data.upcolor);
                AFRAME.utils.entity.setComponentProperty(el, 'scale', data.upscale);
                downed = false;
            }
        };
        this.leaveeventHandler = function leavehandler() {
            downed = false;
            console.log('mouse left: ' + data.leavecolor);
            AFRAME.utils.entity.setComponentProperty(el, 'material.color', data.leavecolor);
            AFRAME.utils.entity.setComponentProperty(el, 'scale', data.leavescale);
        };
    },

    addEventListeners: function () {
        this.el.addEventListener('mouseenter', this.entereventHandler);
        this.el.addEventListener('mousedown', this.downeventHandler);
        this.el.addEventListener('mouseup', this.upeventHandler);
        this.el.addEventListener('mouseleave', this.leaveeventHandler);
    },

    removeEventListeners: function () {
        this.el.removeEventListener('mouseenter', this.entereventHandler);
        this.el.removeEventListener('mousedown', this.downeventHandler);
        this.el.removeEventListener('mouseup', this.upeventHandler);
        this.el.removeEventListener('mouseleave', this.leaveeventHandler);
    }
});
