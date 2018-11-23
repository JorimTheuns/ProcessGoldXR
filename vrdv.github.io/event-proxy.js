
/**
 * Listen to an event.
 * When that event is emitted, emit an event on another entity.
 */

var on = false;

AFRAME.registerComponent('event-proxy', {
  schema: {
    listen: {default: ''},
    target: {default: ''},
    onemit: {default: ''},
    offemit: {default: ''}
  },

  update: function () {
    var data = this.data;
    var sceneEl = document.querySelector('a-scene');
    this.el.addEventListener(data.listen, function () {
        on = !on;
        var x = sceneEl.querySelectorAll(data.target);
        for (var i = 0; i < x.length; i++) {
            if(on){
                x[i].emit(data.onemit);
            } else {
                x[i].emit(data.offemit);
            }
        }
    });
  }
});