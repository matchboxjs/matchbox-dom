var inherit = require("backyard/function/inherit")
var Data = require("./Data")

module.exports = BooleanData

function BooleanData(name, defaultValue, onChange) {
  Data.call(this, name, defaultValue, onChange)
}

inherit(BooleanData, Data)

BooleanData.prototype.type = "Boolean"

BooleanData.prototype.checkType = function(value) {
  return typeof value == "boolean"
}

BooleanData.prototype.parse = function(value) {
  return value === "true"
}

BooleanData.prototype.stringify = function(value) {
  return value ? "true" : "false"
}
