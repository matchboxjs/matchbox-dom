module.exports = EventInit

function EventInit(event, target, capture, once, handler) {
  if (!(this instanceof EventInit)) {
    switch (arguments.length) {
      case 1:
        return new EventInit(event)
      case 2:
        return new EventInit({
          type: event,
          handler: target
        })
      case 3:
        return new EventInit({
          type: event,
          target: target,
          handler: capture
        })
      case 4:
        return new EventInit({
          type: event,
          target: target,
          capture: capture,
          handler: once
        })
      case 5:
        return new EventInit({
          type: event,
          target: target,
          capture: capture,
          once: once,
          handler: handler
        })
    }
  }

  switch (arguments.length) {
    case 1:
      event = {type: event}
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
        handler: capture
      }
      break
    case 4:
      event = {
        type: event,
        target: target,
        capture: capture,
        handler: once
      }
      break
    case 5:
      event = {
        type: event,
        target: target,
        capture: capture,
        once: once,
        handler: handler
      }
      break
  }

  this.type = event.type
  this.target = event.target
  this.once = !!event.once
  this.capture = !!event.capture
  this.handler = event.handler
  this.transform = event.transform
}
