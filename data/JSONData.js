var inherit = require("backyard/function/inherit")
var Data = require("./Data")

module.exports = JSONData

function JSONData(name, defaultValue, onChange) {
  Data.call(this, name, defaultValue, onChange)
}

inherit(JSONData, Data)

JSONData.prototype.type = "json"

JSONData.prototype.checkType = function(value) {
  return value != null
}

JSONData.prototype.parse = function(value) {
  return JSON.parse(value)
}

JSONData.prototype.stringify = function(value) {
  return JSON.stringify(value)
}
