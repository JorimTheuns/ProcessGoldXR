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

        this.entereventHandler = function enterhandler() {
            console.log('mouse entered: ' + data.entercolor);
            AFRAME.utils.entity.setComponentProperty(el, 'material.color', data.entercolor);
            AFRAME.utils.entity.setComponentProperty(el, 'scale', data.enterscale);
        };
        this.downeventHandler = function downhandler() {
            console.log('mouse down: ' + data.downcolor);
            AFRAME.utils.entity.setComponentProperty(el, 'material.color', data.downcolor);
            AFRAME.utils.entity.setComponentProperty(el, 'scale', data.downscale);

        };
        this.upeventHandler = function uphandler() {
            console.log('mouse up: ' + data.upcolor);
            AFRAME.utils.entity.setComponentProperty(el, 'material.color', data.upcolor);
            AFRAME.utils.entity.setComponentProperty(el, 'scale', data.upscale);
        };
        this.leaveeventHandler = function leavehandler() {
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

AFRAME.registerComponent('nodeselectbehaviour', {
    schema: {
        text: {
            default: 'text'
        },
        selecttext: {
            default: 'select'
        },
        height: {
            default: 0.09
        },
        selectheight: {
            default: 0.45
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
            oldPos.y -= 1.5;
            var newPos = oldPos;
            newPos.x -= oldPos.x / 21;
            newPos.y -= oldPos.y / 21;
            newPos.z -= oldPos.z / 21;
            newPos.y += 1.5;
            AFRAME.utils.entity.setComponentProperty(el, 'position', newPos);

            AFRAME.utils.entity.setComponentProperty(el, 'geometry.height', data.selectheight);

            var oldText = AFRAME.utils.entity.getComponentProperty(el, 'text.value');
            AFRAME.utils.entity.setComponentProperty(el, 'text.value', data.selecttext);
        };
        this.upeventHandler = function uphandle() {
            if (downed) {
                var oldPos = AFRAME.utils.entity.getComponentProperty(el, 'position');
                oldPos.y -= 1.5;
                var newPos = oldPos;
                newPos.x += oldPos.x / 20;
                newPos.y += oldPos.y / 20;
                newPos.z += oldPos.z / 20;
                newPos.y += 1.5;
                AFRAME.utils.entity.setComponentProperty(el, 'position', newPos);
                AFRAME.utils.entity.setComponentProperty(el, 'geometry.height', data.height);

                var oldText = AFRAME.utils.entity.getComponentProperty(el, 'text.value');
                AFRAME.utils.entity.setComponentProperty(el, 'text.value', data.text);
                downed = false;
            }
        };
        this.leaveeventHandler = function leavehandler() {
            if (downed) {
                var oldPos = AFRAME.utils.entity.getComponentProperty(el, 'position');
                oldPos.y -= 1.5;
                var newPos = oldPos;
                newPos.x += oldPos.x / 20;
                newPos.y += oldPos.y / 20;
                newPos.z += oldPos.z / 20;
                newPos.y += 1.5;
                AFRAME.utils.entity.setComponentProperty(el, 'position', newPos);
                AFRAME.utils.entity.setComponentProperty(el, 'geometry.height', data.height);

                var oldText = AFRAME.utils.entity.getComponentProperty(el, 'text.value');
                AFRAME.utils.entity.setComponentProperty(el, 'text.value', data.text);
                downed = false;
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
