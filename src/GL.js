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
    uniform vec4 border_color;
    uniform float border_width;
    uniform vec4 background_color;
    uniform vec4 fill_color;
    uniform vec4 grid_color;
    uniform vec4 gradient_color;
    uniform float grid_spacing;

    #define PI 3.14159

    float gradient ( vec2 c ) {
      return sin(c.x * PI);
    }

    float grid ( vec2 c, float s ) {
      return 
        clamp(
          min(
            mod(
              c.y, 
              s), 
            mod(
              c.x, 
              s)), 
          .8, 
          1.);
    }

    float border ( float d, float w ) {
      return abs(d) <= w ? 1. : 0.;
    }

    float fill ( float d ) {
      return clamp(-d * 1000., 0., 1.0);
    }

    void main () {
      vec4 c = background_color;
      vec2 fc = gl_FragCoord.xy + .5;
      vec2 p = gl_FragCoord.xy / viewport.xy;
      float d = texture2D(from, p).a;

      c = mix(c, gradient_color, gradient(p));
      c *= grid(fc, grid_spacing);
      c = mix(c, fill_color, fill(d));
      c = mix(c, border_color, border(d, border_width));

      gl_FragColor = c;
    }
  `
  var count = 3
  var attributes = {
    pos: buffer 
  }
  var uniforms = { 
    viewport, 
    from: regl.prop('from'),
    border_color: regl.prop('border_color'),
    border_width: regl.prop('border_width'),
    background_color: regl.prop('background_color'),
    fill_color: regl.prop('fill_color'),
    grid_color: regl.prop('grid_color'),
    gradient_color: regl.prop('gradient_color'),
    grid_spacing: regl.prop('grid_spacing')
  }
  var framebuffer = regl.prop('to')

  return regl({ vert, frag, count, attributes, uniforms, framebuffer })
}

module.exports.blendSDF = blendSDF
module.exports.render = render
