const viewport = ({ viewportWidth: w, viewportHeight: h }) => [ w, h ]

const blendSDF = function ( regl, { buffer, uniforms: u, sdf, op } ) {
  var count = 3
  var attributes = {
    pos: buffer 
  }
  var uniforms = { viewport }
  var customUniforms = ''
  var sdfFunction = ''
  var opFunction = ''

  for ( var { name, type, value } of u ) {
    uniforms[name] = value || regl.prop(name)
    customUniforms += `uniform ${ type } ${ name };\n`
  }

  sdfFunction += 'float sdf ('
  sdfFunction += sdf.args.map(a => `${ a.type } ${ a.name }`).join(', ')
  sdfFunction += ') {\n'
  sdfFunction += sdf.body
  sdfFunction += '\n}'

  opFunction += 'float op ('
  opFunction += op.args.map(a => `${ a.type } ${ a.name }`).join(', ')
  opFunction += ') { \n'
  opFunction += op.body
  opFunction += '\n}'

  var vert = `
    attribute vec4 pos;

    void main () { 
      gl_Position = pos;
    }
  `
  var frag = `
    precision mediump float; 

    ${ customUniforms }
    ${ sdfFunction }
    ${ opFunction }
    uniform vec2 viewport;

    void main () {
      vec2 p = gl_FragCoord.xy / viewport;
      float d_prev = texture2D(from, p).a;
      float d_next = sdf(p - position, radius);
      float d = op(d_prev, d_next, blend_radius); 

      gl_FragColor = vec4(0, 0, 0, d); 
    }
  `
  var framebuffer = regl.prop('to')

  return regl({ vert, frag, count, attributes, uniforms, framebuffer })
}

const render = function ( regl, { buffer } ) {
  var vert = `
    attribute vec4 pos;

    void main () {
      gl_Position = pos;
    }  
  `
  var frag = `
    precision mediump float; 

    uniform vec2 viewport;
    uniform sampler2D from;

    void main () {
      vec2 p = gl_FragCoord.xy / viewport.xy;
      float d = texture2D(from, p).a;
      float a = d <= 0. ? 1. : 0.;

      gl_FragColor = vec4(1, 0, 1, a);
    }
  `
  var count = 3
  var attributes = {
    pos: buffer 
  }
  var uniforms = { 
    viewport, 
    from: regl.prop('from') 
  }
  var framebuffer = regl.prop('to')

  return regl({ vert, frag, count, attributes, uniforms, framebuffer })
}

module.exports.blendSDF = blendSDF
module.exports.render = render
