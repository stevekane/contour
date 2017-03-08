var React = require('react')
var DOM = require('react-dom')
var Regl = require('regl')
var UI = require('./UI')
var GL = require('./GL')
var BIG_TRIANGLE = require('big-triangle')
var UI_LAYER = document.createElement('div')
var GL_LAYER = document.createElement('div')

var ROYAL_BLUE = [ 39 / 255, 64 / 255, 139 / 255, 1 ]
var CORNFLOWER_BLUE = [ 100 / 255, 149 / 255, 247 / 255, 1 ]
var LIGHT_GRAY = [ .8, .8, .8, 1 ]
var MEDIUM_GRAY = [ .5, .5, .5, 1 ]
var DARK_GRAY = [ .1, .1, .1, 1 ]

document.body.appendChild(GL_LAYER)
document.body.appendChild(UI_LAYER)

Object.assign(document.documentElement.style, {
  height: '100%'
})
Object.assign(document.body.style, {
  margin: 0,
  height: '100%'
})

Object.assign(UI_LAYER.style, {
  width: '100%',
  height: '100%',
  boxSizing: 'border-box',
  position: 'fixed'
})

Object.assign(GL_LAYER.style, {
  width: '100%',
  height: '100%',
  boxSizing: 'border-box',
  position: 'fixed'
})

var regl = Regl({
  extensions: [ 'OES_texture_float', 'WEBGL_draw_buffers' ],
  container: GL_LAYER
})
var bt = BIG_TRIANGLE(4)
var smoothBlendCircle = GL.blendSDF(regl, {
  buffer: bt,
  uniforms: [
    { name: 'position', type: 'vec2' },
    { name: 'radius', type: 'float' },
    { name: 'blend_radius', type: 'float' },
    { name: 'from', type: 'sampler2D' }
  ],
  sdf: {
    args: [ 
      { name: 'p', type: 'vec2' }, 
      { name: 'r', type: 'float' }
    ],
    body: 'return length(p) - r;'
  },
  op: {
    args: [
      { name: 'a', type: 'float' },
      { name: 'b', type: 'float' },
      { name: 'r', type: 'float' }
    ],
    body: `
      vec2 u = max(vec2(r - a,r - b), vec2(0));
      
      return max(r, min (a, b)) - length(u);
    `
  }
})
var render = GL.render(regl, { buffer: bt })

var state = {
  edits: [],
  shape: new Shape(regl, 10)
}

function Shape ( regl, power ) {
  var width = height = Math.pow(2, power)
  var color = [ 0, 0, 0, 1 ]
  var to = regl.framebuffer({ width, height, colorType: 'float' })
  var from = regl.framebuffer({ width, height, colorType: 'float' })


  this.to = to
  this.from = from
  regl.clear({ framebuffer: to, color })
  regl.clear({ framebuffer: from, color })
}

function addEdit ( state, edit ) {
  var { edits, shape } = state
  var tmp
  
  edits.push(edit)
  smoothBlendCircle({ 
    position: edit.position, 
    radius: edit.radius, 
    blend_radius: edit.blend_radius,
    from: shape.from,
    to: shape.to
  })
  tmp = shape.from
  shape.from = shape.to
  shape.to = tmp
}

function update () {
  addEdit(state, {
    position: [ Math.random(), Math.random() ],
    radius: Math.random() / 100,
    blend_radius: 0.05
  })
  render({
    from: state.shape.from,
    border_width: 0.001,
    border_color: ROYAL_BLUE,
    fill_color: CORNFLOWER_BLUE,
    background_color: MEDIUM_GRAY,
    gradient_color: LIGHT_GRAY,
    grid_color: DARK_GRAY,
    grid_spacing: 40
  })
  DOM.render(<div>{ state.edits.length }</div>, UI_LAYER)
}

regl.frame(update)
