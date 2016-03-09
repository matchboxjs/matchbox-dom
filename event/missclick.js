module.exports = missclick

var elements = []
var listeners = []

function missclick(element, cb) {
  if (isRegistered(element)) {
    return
  }

  register(element, cb)
}

function isRegistered(element) {
  return !!~elements.indexOf(element)
}

function register(element, cb) {
  function listener(e) {
    if (!isRegistered(element)) {
      removeListener()
    }
    else if (!element.contains(e.target) && e.target != element) {
      removeListener()
      cb && cb(e)
    }
  }

  function removeListener() {
    document.body.removeEventListener("click", listener, false)
    if (isRegistered(element)) {
      elements.splice(elements.indexOf(element), 1)
      listeners.splice(listeners.indexOf(removeListener), 1)
    }
  }

  document.body.addEventListener("click", listener, false)

  elements.push(element)
  listeners.push(removeListener)
}

missclick.remove = function(element) {
  if (isRegistered(element)) {
    listeners[elements.indexOf(element)]()
  }
}
