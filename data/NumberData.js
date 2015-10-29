var inherit = require("matchbox-factory/inherit")
var Data = require("../Data")

module.exports = NumberData

function NumberData (name, defaultValue, onChange) {
  Data.call(this, name, defaultValue, onChange)
}

inherit(NumberData, Data)

NumberData.prototype.type = "number"

NumberData.prototype.checkType = function (value) {
  return typeof value == "number"
}

NumberData.prototype.parse = function (value) {
  return parseInt(value, 10)
}

NumberData.prototype.stringify = function (value) {
  return ""+value
}
