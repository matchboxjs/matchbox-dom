var inherit = require("backyard/function/inherit")
var ModifierInit = require("./ModifierInit")

module.exports = EnumModifier

function EnumModifier(defaultValue, values, animationDuration) {
  if (!(this instanceof EnumModifier)) {
    return new EnumModifier(defaultValue, values, animationDuration)
  }

  this.type = "enum"
  this.default = defaultValue
  this.values = values
  this.animationDuration = animationDuration
}

inherit(EnumModifier, ModifierInit)
