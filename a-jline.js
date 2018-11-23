AFRAME.registerPrimitive('a-jline', {

    defaultComponents: {
        meshline: {}
    },

    // Maps HTML attributes to the `lineWidth` component's properties.
    mappings: {
        linewidth: 'meshline.linewidth',
        color: 'meshline.color',
        path: 'meshline.path',
        linewidthstyler: 'meshline.lineWidthStyler'
    }
});
