module.exports = ModifierInit

function ModifierInit(options) {
  this.type = options.type
  this.default = options.default == null ? null : options.default
  this.values = options.values
  this.animationDuration = options.animationDuration
}
