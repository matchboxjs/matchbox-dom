var inherit = require("backyard/function/inherit")
var Data = require("./Data")

module.exports = FloatData

function FloatData(name, defaultValue, onChange) {
  Data.call(this, name, defaultValue, onChange)
}

inherit(FloatData, Data)

FloatData.prototype.type = "float"

FloatData.prototype.checkType = function(value) {
  return typeof value == "number"
}

FloatData.prototype.parse = function(value) {
  return parseFloat(value)
}

FloatData.prototype.stringify = function(value) {
  return "" + value
}
