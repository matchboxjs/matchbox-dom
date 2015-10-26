var Attribute = require("matchbox-attributes/Attribute")
var DomString = require("./DomString")
var DomBoolean = require("./DomBoolean")
var DomNumber = require("./DomNumber")
var DomFloat = require("./DomFloat")
var DomJSON = require("./DomJSON")

var attributes = module.exports = {}

attributes.String = DomString
attributes.Boolean = DomBoolean
attributes.Number = DomNumber
attributes.Float = DomFloat
attributes.JSON = DomJSON

attributes.create = function (def) {
  switch (Attribute.getType(def)) {
    case "string":
      return new DomString(def)
    case "boolean":
      return new DomBoolean(def)
    case "number":
      return new DomNumber(def)
    case "float":
      return new DomFloat(def)
    case "json":
      return new DomJSON(def)
  }
}
