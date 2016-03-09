module.exports = ActionInit

function ActionInit(event, target, lookup, handler) {
  if (!(this instanceof ActionInit)) {
    switch (arguments.length) {
      case 1:
        return new ActionInit(event || {})
      case 2:
        return new ActionInit({
          type: event,
          handler: target
        })
      case 3:
        return new ActionInit({
          type: event,
          target: target,
          handler: lookup
        })
      case 4:
        return new ActionInit({
          type: event,
          target: target,
          lookup: lookup,
          handler: handler
        })
    }
  }

  switch (arguments.length) {
    case 1:
      event = event || {}
      break
    case 2:
      event = {
        type: event,
        handler: target
      }
      break
    case 3:
      event = {
        type: event,
        target: target,
        handler: lookup
      }
      break
    case 4:
      event = {
        type: event,
        target: target,
        lookup: lookup,
        handler: handler
      }
      break
  }

  this.eventOptions = event
  this.lookup = event.lookup
}
