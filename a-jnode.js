AFRAME.registerPrimitive('a-jnode', {

    defaultComponents: {
        plane: {},
        event-set__enter: {_event: 'mouseenter'},
        event-set__down: {_event: 'mousedown'},
        event-set__up: {_event: 'mouseeup'},
        event-set__leave: {_event: 'mouseleave'}
    },

    // Maps HTML attributes to the `lineWidth` component's properties.
    mappings: {
        position: 'plane.position',
        rotation: 'plane.rotation',
        width: 'plane.width',
        height: 'plane.height',
        color: 'plane.color',
        text: 'plane.text',
        enter-color: 'event-set__enter.material.color',
        enter-scale: 'event-set__enter.scale',
        down-color: 'event-set__down.material.color',
        down-scale: 'event-set__down.scale',
        up-color: 'event-set__up.material.color',
        up-scale: 'event-set__up.scale',
        leave-color: 'event-set__leave.material.color',
        leave-scale: 'event-set__leave.scale'
    }
});
