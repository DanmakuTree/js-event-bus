// valiodate this the number is a vild number for the number of executions
function validateNumber(n) {
    var type = n.constructor.name

    if (type === 'Number') {
        return n
    } else if (type === 'String' && n.toLowerCase() === 'any') {
        return 'any'
    }

    throw new Error(
        'Only `Number` and `any` are accepted in the number of possible executions!'
    )
};

// return wether or not this event needs to be removed
function toBeRemoved(info) {
    var number = info.number
    info.execution = info.execution || 0
    info.execution++
    if (number === 'any' || info.execution < number) {
        return false
    }
    return true
}

export class EventBus {
    constructor() {
        this.listeners = {}
    }

    registerListener(event, callback, number) {
        var type = event.constructor.name
        number = validateNumber(number || 'any')

        if (type !== 'Array') {
            event = [event]
        }

        event.forEach((e) => {
            if (e.constructor.name !== 'String') {
                throw new Error(
                    'Only `String` and array of `String` are accepted for the event names!'
                )
            }
            this.listeners[e] = this.listeners[e] || []
            this.listeners[e].push({
                callback: callback,
                number: number
            })
        })
    };

    /**
     * Attach a callback to an event
     * @param {string} eventName - name of the event.
     * @param {function} callback - callback executed when this event is triggered
     */
    on(eventName, callback) {
        debugger
        this.registerListener(eventName, callback, 'any')
    }

    /**
     * Attach a callback to an event. This callback will not be executed more than once if the event is trigger mutiple times
     * @param {string} eventName - name of the event.
     * @param {function} callback - callback executed when this event is triggered
     */
    once(eventName, callback) {
        this.registerListener(eventName, callback, 1)
    }

    /**
     * Attach a callback to an event. This callback will be executed will not be executed more than the number if the event is trigger mutiple times
     * @param {number} number - max number of executions
     * @param {string} eventName - name of the event.
     * @param {function} callback - callback executed when this event is triggered
     */
    exactly(number, eventName, callback) {
        this.registerListener(eventName, callback, number)
    }

    /**
     * Kill an event with all it's callbacks
     * @param {string} eventName - name of the event.
     */
    die(eventName) {
        delete this.listeners[eventName]
    }

    /**
     * Kill an event with all it's callbacks
     * @param {string} eventName - name of the event.
     */
    off(eventName) {
        this.die(eventName)
    }

    /**
     * Remove the callback for the given event
     * @param {string} eventName - name of the event.
     * @param {callback} callback - the callback to remove (undefined to remove all of them).
     */
    detach(eventName, callback) {
        if (callback === undefined) {
            this.listeners[eventName] = []
            return true
        }

        for (var k in this.listeners[eventName]) {
            if (this.listeners[eventName][k] && this.listeners[eventName][k].callback === callback) {
                this.listeners[eventName].splice(k, 1)
                return this.detach(eventName, callback)
            }
        }

        return true
    }

    /**
     * Remove all the events
     */
    detachAll() {
        for (var eventName in this.listeners) {
            if (this.listeners[eventName]) {
                this.detach(eventName)
            }
        }
    }

    /**
     * Emit the event
     * @param {string} eventName - name of the event.
     */
    emit(eventName, context) {
        var listeners = []
        for (const name in this.listeners) {
            if (this.listeners[name]) {
                if (name === eventName) {
                    // TODO: this lib should definitely use > ES5
                    Array.prototype.push.apply(listeners, this.listeners[name])
                }

                if (name.indexOf('*') >= 0) {
                    var newName = name.replace(/\*\*/, '([^.]+.?)+')
                    newName = newName.replace(/\*/g, '[^.]+')

                    var match = eventName.match(newName)
                    if (match && eventName === match[0]) {
                        Array.prototype.push.apply(listeners, this.listeners[name])
                    }
                }
            }
        }

        var parentArgs = arguments

        context = context || this
        listeners.forEach((info, index) => {
            var callback = info.callback
            var number = info.number

            if (context) {
                callback = callback.bind(context)
            }

            var args = []
            Object.keys(parentArgs).map(function (i) {
                if (i > 1) {
                    args.push(parentArgs[i])
                }
            })

            // this event cannot be fired again, remove from the stack
            if (toBeRemoved(info)) {
                this.listeners[eventName].splice(index, 1)
            }

            callback.apply(null, args)
        })
    }
}

export default new EventBus()