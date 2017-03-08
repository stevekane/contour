var React = require('react')
var DOM = require('react-dom')
var { Button, TextInput } = require('belle')
var UI_LAYER = document.createElement('div')
var GL_LAYER = document.createElement('div')

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

document.body.appendChild(GL_LAYER)
document.body.appendChild(UI_LAYER)

DOM.render(<TextInput defaultValue="Hey friends" />, UI_LAYER)
