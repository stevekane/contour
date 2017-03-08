var React = require('react')
var { Card, Button, TextInput } = require('belle')

const log = console.log.bind(console)
const targetAttr = k => ({ target }) => target[k]
const compose = (f1, f2) => v => f1(f2(v))

const onClick = compose(log, targetAttr('innerText'))

class TitleBar extends React.Component {
  render() { 
    return (
    <Card>
      <Button onClick={ onClick }>Circle</Button>
      <Button onClick={ onClick }>Square</Button>
    </Card>
   )}
} 

class UI extends React.Component {
  render() { 
    return (
    <div>
      <TitleBar />
    </div>
  )}
}

module.exports = UI
