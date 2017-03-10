const { red, white, green } = require('chalk')
const { sqrt, pow, min, max } = Math

const length = v => sqrt(pow(v[0], 2) + pow(v[1], 2))
const empty = _ => 1
const mappend = (p, e1, e2) => _ => min(e1(p), e2(p))

const BOUND = 1
const CELL_SIZE = .1
const edits = [ 
  p => length(p) - .5,
  p => length([ p[0] - 1, p[1] - 1 ]) - .5,
  p => length([ p[0] + 1, p[1] + 1 ]) - .5
]

function compute ( edits, p ) {
  return edits.reduce(mappend.bind(null, p), empty)
}

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

print(voxels)
