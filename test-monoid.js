const { red, white, green } = require('chalk')
const { floor, sqrt, pow, min, max, abs } = Math

const BOUND = 1
const CELL_SIZE = .1

const lerp = ( min, max, i ) => min + i * ( max - min )
const zipWith = f => ( v1, v2 ) => v1.map((c, i) => f(c, v2[i]))
const vlength = v => sqrt(pow(v[0], 2) + pow(v[1], 2))
const vsub = zipWith(( x, y ) => x - y)
const vadd = zipWith(( x, y ) => x + y)
const vabs = v => v.map(abs)
const circle  = ( c, r ) => p => vlength(vsub(p, c)) - r
const empty = _ => 1
const mappend = ( p, e1, e2 ) => _ => min(e1(p), e2(p))
const compute = ( es, p ) => es.reduce(mappend.bind(null, p), empty)

const edits = [ 
  circle([ 0, 0 ], .2),
  circle([ .5, .5 ], .2)
]

// TODO: TYPICALLY THE RESOLUTION IS FIXED.  maybe change this?
function voxelize ( left, right, bottom, top, spacing, edits ) {
  var i, j, d, out = []

  for ( i = 0, y = bottom; y <= top; y += spacing, i++ ) {
    out.push([])
    for ( j = 0, x = left; x <= right; x += spacing, j++ ) {
      out[i].push(compute(edits, [ x, y ])().toFixed(2))
    }
  }
  return out
}

// TODO: not working.  consider fixing or just delete?  not really important..
function vox2 ( fb, edits ) {
  var { w, h } = fb
  var left = bottom = -1
  var right = top = 1
  var rangex = right - left
  var rangey = top - bottom

  for ( var i = 0, cx, cy, x, y; i < w * h; i++ ) {
    cx = floor(i / w)
    cy = i % w
    x = lerp(left, right, cx / rangex)
    y = lerp(bottom, top, cy / rangey)
    console.log({ cx, cy, x, y })
  }
}

vox2({ w: 4, h: 4 })

function print ( voxels ) {
  for ( var i = 0; i < voxels.length; i++ ) {
    process.stdout.write('\n')
    for ( var j = 0; j < voxels[i].length; j++ ) {
      d = voxels[i][j]
      process.stdout.write((d <=0 ? red(d) : white(d)) + '\t')
      
    } 
    process.stdout.write('\n')
  }
}

const voxels = voxelize(-BOUND, BOUND, -BOUND, BOUND, CELL_SIZE, edits)

// print(voxels)
