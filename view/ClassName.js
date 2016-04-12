module.exports = Modifier

function Modifier(defaultValue, values, animationDuration, onChange, modifInit) {
  if (!(this instanceof Modifier)) {
    return new Modifier(defaultValue)
  }

  switch (arguments.length) {
    case 1:
      if (Array.isArray(defaultValue)) {
        values = defaultValue
        defaultValue = null
      }
      else {
        defaultValue = defaultValue || {}
        values = defaultValue.values
        animationDuration = defaultValue.animationDuration
        onChange = defaultValue.onChange
        defaultValue = defaultValue.default
      }
      break
    case 2:
      switch (typeof values) {
        case "number":
          animationDuration = values
          values = [defaultValue]
          break
        case "function":
          onChange = values
          values = [defaultValue]
          break
      }
      break
    case 3:
      switch (typeof animationDuration) {
        case "function":
          onChange = animationDuration
          animationDuration = 0
          break
      }
      break
  }

  if (!Array.isArray(values)) {
    values = [defaultValue]
  }
  if (typeof animationDuration != "number") {
    animationDuration = 0
  }
  if (typeof onChange != "function") {
    onChange = null
  }

  this.default = defaultValue
  this.values = values
  this.onchange = onChange
  this.animationDuration = animationDuration
  this.value = null
  this.timerId = null
  this.toggledValue = null
}

Modifier.prototype.clone = function() {
  return new this.constructor(this)
}

Modifier.prototype.reset = function(element, context) {
  var currentClassName = null
  var hasInitialValue = this.values.some(function(value) {
    if (value && element.classList.contains(value)) {
      currentClassName = value
      return true
    }
    return false
  })

  if (hasInitialValue) {
    this.value = currentClassName
  }
  else if (this.default != null) {
    this.set(this.default, element, context)
  }
}

Modifier.prototype.get = function() {
  return this.value
}

Modifier.prototype.hasValue = function() {
  return this.value != null
}

Modifier.prototype.isSet = function(element) {
  return this.value != null && element.classList.contains(this.value)
}

Modifier.prototype.toggle = function(element, context) {
  if (this.isSet(element)) {
    this.toggledValue = this.value
    return this.remove(element, context)
  }

  var value = this.toggledValue
  this.toggledValue = null

  return this.set(value, element, context)
}

Modifier.prototype.set = function(value, element, context) {
  context = context || element

  var previousValue = this.value
  var newValue = value

  if (previousValue === newValue || !~this.values.indexOf(newValue)) {
    return Promise.resolve()
  }
  if (previousValue && element.classList.contains(previousValue)) {
    element.classList.remove(previousValue)
  }
  this.value = newValue
  if (newValue) {
    element.classList.add(newValue)
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

  if (previousValue && element.classList.contains(previousValue)) {
    element.classList.remove(previousValue)
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
