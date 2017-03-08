var React = require('react')
var DOM = require('react-dom')
var Regl = require('regl')
var UI = require('./UI')
var GL = require('./GL')
var BIG_TRIANGLE = require('big-triangle')
var UI_LAYER = document.createElement('div')
var GL_LAYER = document.createElement('div')

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
var blendSDF = GL.blendSDF(regl, {
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

var POW = 10
var width = height = Math.pow(2, POW)
var accum = regl.framebuffer({ width, height, colorType: 'float' })
var each = regl.framebuffer({ width, height, colorType: 'float' })

function update ({ time, tick }) {
  regl.clear({ framebuffer: accum, color: [ 0, 0, 0, 1 ] })
  regl.clear({ framebuffer: each, color: [ 0, 0, 0, 1 ] })
  blendSDF({ 
    position: [ .8, .5 ], 
    radius: .3, 
    blend_radius: 0.1,
    from: accum,
    to: each
  })
  blendSDF({
    position: [ .2, .5 ],
    radius: .3,
    blend_radius: 0.1,
    from: each,
    to: accum
  })
  render({
    to: null,
    from: accum
  })
  DOM.render(<UI />, UI_LAYER)
}

update({ time: 0, tick: 0 })
// regl.frame(update)
