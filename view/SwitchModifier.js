var inherit = require("backyard/function/inherit")
var ModifierInit = require("./ModifierInit")

module.exports = SwitchModifier

function SwitchModifier(defaultValue, on, off, animationDuration) {
  if (!(this instanceof SwitchModifier)) {
    return new SwitchModifier(defaultValue, on, off, animationDuration)
  }

  this.type = "switch"
  this.default = defaultValue
  this.on = on
  this.off = off
  this.animationDuration = animationDuration
}

inherit(SwitchModifier, ModifierInit)
