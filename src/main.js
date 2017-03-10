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

/*
Evaluation: Compute Composite SDF for every position in the framebuffer
N, M = width and height of framebuffer
L    = Length of edits
C    = N * M * C

There is absolutely no dependence on other cells to compute the value of a given cell

Therefore, if we had N x M threads, we could compute the result for a given cell in parallel

There are two causes of inefficiency here:  

1. We're calculating the contribution of SDFs that are very far away from the cell.  
   This means they will have a non-visual effect on that cell and probably should be culled.
2. We need to deal with the data supplying the SDF field changing every frame.  This means
   we cannot simply compile a "hard-coded" shader to represent the SDF because the cost of
   re-compilation is too high ( especially true in webgl ).  Furthermore, this cost would 
   not scale well if we have many objects in the scene.

We can store the editlist in a texture in order to by-pass the size-limitations of uniforms.
We would then need to loop over that texture in the fragment shader sampling all of its contents
( or breaking early if a certain trigger value is detected representing un-used edits ).  
We would then be able to do N * M * L computations for our scene.  This number is likely to be way
too high to be fast enough to execute in our main-loop.  

It's worth pointing out here as well that we're trying to support large numbers of edits ( 1e4 )

If we extend this reasoning into 3d ( the real goal overall ) we would have another factor of D ( depth )
which would mean our cost is enormous to compute per-frame.  Thus, we almost certainly must be ruthless
about performing only the meaningful SDF computations for a given cell.  An example calculation below:

N = 1024 ( 2^10 )
M = 1024 ( 2^10 )
L = 4096 ( 2^12 )

T = N * M * L == 2^32 ~ 4billion

This means that even if we can save 99% of this cost through some sort of partitioning scheme, we are still
trying to do 42million computations

Let's also call out the min-bound here where we have an editlist of 1 edit.  

Tmin = N * M * 1 == 2^20 ~ 1million

It's worth pointing out that the above calculates the contribution of a single edit across all the cells.

If we assume that the average size of an edit is ~10% of the available cells ( not sure if this is correct 
but as a heuristic it might not be crazy ) and assume we can somehow cull the edits from cells that are 
far away:

This allows us to drop the total computations by a factor of 10 meaning we'd be sitting at an average cost
of ~100,000 computations.  Or more generally, we can reduce the number of the computations by this same heuristic
for the general case which saves us ~2^3 computations.

Thus, for the L above (4096), we would have 2^29 ~500million calculations

It seems therefore that we must do even more culling.  Perhaps there is a final opportunity here for any cell 
that already is fully overlapped.  We can simply recognize that no additional cells will provide a meaningful 
contribution to the distance field value at that point.  This means that, in fact, we only need to store more than
one edit in cells for which no overlapping object has already been identified.  Maybe this can be done w/ a mask?
We could use a shader to read every edit once and splat out an mask for each shape (along with the index of the shape )
that was responsible for masking that region.  Then, we could run a second shader which only considers the contributions
of nearby influencing shapes if the mask value for that region is not saturated.

If this works, you could wildly reduce the cost down to the base-case which is ~ N x M or ~1million.

This ALSO begs the question if the correct storage of the computed SDF is even a voxel texture at all?  Maybe there
is a more sparse data structure that would deal more efficiently with voids and areas of higher complexity?  This 
possibility is as-yet un-explored but it might be very worthwhile to explore.  It seems that CPU implementations
might be easier to explore than GPU while formulating a strategy for reducing the cost.
*/


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
  extensions: [ 'OES_texture_float' ],
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
