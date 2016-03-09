var inherit = require("backyard/function/inherit")
var Data = require("./Data")

module.exports = StringData

function StringData(name, defaultValue, onChange) {
  Data.call(this, name, defaultValue, onChange)
}

inherit(StringData, Data)

StringData.prototype.type = "string"

StringData.prototype.checkType = function(value) {
  return typeof value == "string"
}

StringData.prototype.parse = function(value) {
  return value ? "" + value : ""
}

StringData.prototype.stringify = function(value) {
  return value ? "" + value : ""
}
