AFRAME.registerPrimitive('a-jline', {

  defaultComponents: {
    mymeshline: {}
  },

  // Maps HTML attributes to the `lineWidth` component's properties.
  mappings: {
    color: 'mymeshline.color',
    linewidth: 'mymeshline.linewidth',
    linewidthstyler: 'mymeshline.linewidthstyler',
    path: 'mymeshline.path'
  }
});

AFRAME.registerComponent('mymeshline', {
	schema: {
		color: {
		default:
			'#000'
		},
		linewidth: {
		default:
			1
		},
		linewidthstyler: {
		default:
			'1'
		},
		path: {
		default:
			[{
					x: 0,
					y: 0,
					z: 0
				}, {
					x: 0,
					y: 1,
					z: 0
				}, {
					x: 0,
					y: 0,
					z: 1
				}, {
					x: 1,
					y: 1,
					z: 0
				}
			],
			// Deserialize path in the form of comma-separated vec3s: `0 0 0, 1 1 1, 2 0 3`.
			parse: function (value) {
				return value.split(',').map(AFRAME.utils.coordinates.parse);
			},
			// Serialize array of vec3s in case someone does setAttribute('line', 'path', [...]).
			stringify: function (data) {
				return data.map(AFRAME.utils.coordinates.stringify).join(',');
			}
		}
	},

	init: function () {

		this.resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);

		var sceneEl = this.el.sceneEl;
		sceneEl.addEventListener('render-target-loaded', this.do_update.bind(this));
		sceneEl.addEventListener('render-target-loaded', this.addlisteners.bind(this));

	},

	addlisteners: function () {
		window.addEventListener('resize', this.do_update.bind(this));
	},

	update: function () {

		var material = new THREE.MeshLineMaterial({
				color: new THREE.Color(this.data.color),
				resolution: this.resolution,
				sizeAttenuation: false,
				linewidth: this.data.linewidth
			});

		var canvas = this.el.sceneEl.canvas;
		this.resolution.set(canvas.width, canvas.height);
		
		let p = this.data.path;
		let totalPoints = [];

		for (let i = 0; i < p.length; i++) {
			var point = new THREE.Vector3(p[i].x, p[i].y, p[i].z);
			totalPoints.push(...point);
		}
		
		var geometry = new THREE.Geometry();

		totalPoints.forEach(function (vec3) {
			geometry.vertices.push(
				new THREE.Vector3(vec3.x, vec3.y, vec3.z));
		});

		var widthFn = new Function('p', 'return ' + this.data.linewidthstyler);
		//? try {var w = widthFn(0);} catch(e) {warn(e);}
		var line = new THREE.MeshLine();
		line.setGeometry(geometry, widthFn);
		var meshLine = new THREE.Mesh(line.geometry, material);

		this.el.setObject3D('mesh', meshLine);
		
	},

	remove: function () {
		this.el.removeObject3D('mesh');
	}
});

