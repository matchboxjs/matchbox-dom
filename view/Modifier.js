module.exports = Modifier

function Modifier(modifInit) {
  this.type = modifInit.type
  this.default = modifInit.default == null ? null : modifInit.default
  this.values = []
  this.value = null
  this.onchange = null
  this.animationDuration = modifInit.animationDuration || 0
  this.timerId = null
  switch (this.type) {
    case "switch":
      this.values.push(modifInit.on && typeof modifInit.on == "string" ? modifInit.on : null)
      this.values.push(modifInit.off && typeof modifInit.off == "string" ? modifInit.off : null)
      break
    case "enum":
      this.values = modifInit.values || []
      break
  }
}

Modifier.prototype.reset = function(element, context) {
  var currentValue
  var hasInitialValue = this.values.some(function(value) {
    if (value && element.classList.contains(value)) {
      currentValue = value
      return true
    }
    return false
  })

  if (hasInitialValue) {
    if (this.type == "switch") {
      // on
      if (currentValue === this.values[0]) {
        this.value = true
      }
      // off
      if (currentValue === this.values[1]) {
        this.value = false
      }
    }
    else {
      this.value = currentValue
    }
  }
  else if (this.default != null) {
    this.set(this.default, element, context)
  }
}

Modifier.prototype.get = function() {
  return this.value
}

Modifier.prototype.set = function(value, element, context) {
  context = context || element

  var previousValue = this.value
  var previousClassName = previousValue
  var newValue = value
  var newClassName = value

  if (this.type == "switch") {
    newValue = !!value

    var on = this.values[0]
    var off = this.values[1]

    previousClassName = previousValue == null
        ? null
        : previousValue ? on : off
    newClassName = newValue ? on : off
  }

  if (previousValue === newValue || !~this.values.indexOf(newClassName)) {
    return Promise.resolve()
  }
  if (previousClassName && element.classList.contains(previousClassName)) {
    element.classList.remove(previousClassName)
  }
  this.value = newValue
  if (newClassName) {
    element.classList.add(newClassName)
  }

  return callOnChange(this, context, previousValue, newValue)
}

Modifier.prototype.remove = function(element, context) {
  context = context || element
  if (this.value == null) {
    return Promise.resolve()
  }
  if (this.timerId) {
    clearTimeout(this.timerId)
    this.timerId = null
  }

  var previousValue = this.value
  var previousClassName = previousValue

  if (this.type == "switch") {
    var on = this.values[0]
    var off = this.values[1]

    previousClassName = previousValue == null
        ? null
        : previousValue ? on : off
  }

  if (previousClassName && element.classList.contains(previousClassName)) {
    element.classList.remove(previousClassName)
  }
  this.value = null

  return callOnChange(this, context, previousValue, null)
}

function callOnChange(modifier, context, previousValue, newValue) {
  return new Promise(function(resolve) {
    if (modifier.animationDuration) {
      if (modifier.timerId) {
        clearTimeout(modifier.timerId)
        modifier.timerId = null
      }
      modifier.timerId = setTimeout(resolve, modifier.animationDuration)
    }
    else {
      resolve()
    }
  }).then(function() {
    if (typeof modifier.onchange == "function") {
      return modifier.onchange.call(context, previousValue, newValue)
    }
  })
}
