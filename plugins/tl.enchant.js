/*
 * Tl.enchant.js
 * @ Version 0.3
 * @ Require enchant.js v0.4.3 or later
 * @ Author sidestepism
 *
 * @ Example
 * Var bear = new Sprite (32, 32);
 * Bear.image = game.assets ['icon0.gif'];
 * Bear.tl.moveTo (64, 64, 30) fadeOut (30).;
 * Game.rootScene.addChild (bear);
 *
 * @ Example
 * Var bear = new Sprite (32, 32);
 * Bear.tl.hide (). Tween ({
 * Opacity: 0,
 * ScaleX: 3,
 * ScaleY: 3,
 * Time: 30
 *});
 * Game.rootScene.addChild (bear);
 *
 * @ Example
 * Var bear = new Sprite (32, 32);
 * Bear.cue ({
 * 0: function () {do.something ();},
 * 10: function () {do.something ();},
 * 20: function () {do.something ();},
 * 30: function () {do.something ();}
 *});
 *
 */

/*
 * Plugin namespace object
 */
enchant.tl = {};

/*
 * Events that are emitted when the action is added to the timeline
 */
enchant.Event.ADDED_TO_TIMELINE = "addedtotimeline";
/*
 * Events that are emitted when the action has been removed from the Timeline
 * Even when looped is set, the action will be added once again be removed from the Timeline
 */
enchant.Event.REMOVED_FROM_TIMELINE = "removedfromtimeline";

/*
 * Events that are emitted when the action has been initiated
 */
enchant.Event.ACTION_START = "actionstart";

/*
 * Events that are issued when an action is completed
 */
enchant.Event.ACTION_END = "actionend";

/*
 * Events that are issued when an action has passed one frame
 */
enchant.Event.ACTION_TICK = "actiontick";

/*
 * When the action has been added, an event that is issued to the time line
 */
enchant.Event.ACTION_ADDED = "actionadded";
/*
 * When the action is removed, an event that is issued to the time line
 */
enchant.Event.ACTION_REMOVED = "actionremoved";

/*
 * When Node is created, I add a Timeline object to tl property
 */
(Function () {
    var orig = enchant.Node.prototype.initialize;
    enchant.Node.prototype.initialize = function () {
        orig.apply (this, arguments);
        var tl = this.tl = new enchant.tl.Timeline (this);
        this.addEventListener ("enterframe", function () {
            tl.dispatchEvent (new enchant.Event ("enterframe"));
        });
    };
}) ();

/*
 * @ Scope enchant.tl.ActionEventTarget
 */
enchant.tl.ActionEventTarget = enchant.Class.create (enchant.EventTarget, {
    /*
     * EventTarget I had to rewrite the this.target the context when you run the event listener
     * @ Constructs
     * @ Extends enchant.EventTarget
     */
    initialize: function () {
        enchant.EventTarget.apply (this, arguments);
    }
    /*
     * Issue event.
     * @ Param {enchant.Event} e Event issued.
     */
    dispatchEvent: function (e) {
        if (this.node) {
            var target = this.node;
            e.target = target;
            e.localX = ex - target._offsetX;
            e.localY = ey - target._offsetY;
        } Else {
            this.node = null;
        }

        . if (! this ['on' + e.type] = null) this ['on' + e.type] call (target, e);
        var listeners = this._listeners [e.type];
        if (listeners! = null) {
            listeners = listeners.slice ();
            for (var i = 0, len = listeners.length; i <len; i + +) {
                . listeners [i] call (target, e);
            }
        }
    }
});

/*
 * @ Scope enchant.tl.Action
 */
enchant.tl.Action = enchant.Class.create (enchant.tl.ActionEventTarget, {
    /*
     * Action class.
     * Actions are units that make up the time line,
     * It is a unit used to specify the action you want to perform.
     * Action has been added to the time line is performed in order.
     *
     * Actionstart, actiontick event is fired when the action is started and stopped,
     * When one frame has elapsed actiontick event is also issued.
     * Specify the action you want to perform as a listener for these events.
     *
     * The transition to the next action automatically the number of frames that are specified in the time has elapsed,
     * I do not want to migrate null is specified, next method of time until the line is called.
     *
     * @ Param param
     * The number of frames @ config {integer} [time] action is sustained. infinite length is specified null
     * Event listener when @ config {function} [onactionstart] action is initiated
     * Event listener when @ config {function} [onactiontick] action has passed one frame
     * Event listener when @ config {function} [onactionend] action is terminated
     */
    initialize: function (param) {
        enchant.tl.ActionEventTarget.call (this);
        this.time = null;
        this.frame = 0;
        for (var key in param) if (param.hasOwnProperty (key)) {
            if (! param [key] = null) this [key] = param [key];
        }

        var action = this;

        this.timeline = null;
        this.node = null;

        this.addEventListener (enchant.Event.ADDED_TO_TIMELINE, function (evt) {
            action.timeline = evt.timeline;
            action.node = evt.timeline.node;
        });

        this.addEventListener (enchant.Event.REMOVED_FROM_TIMELINE, function (evt) {
            action.timeline = null;
            action.node = null;
            action.frame = 0;
        });

        this.addEventListener (enchant.Event.ACTION_TICK, function (evt) {
            action.frame + +;
            if (action.time! = null && action.frame> action.time) {
                evt.timeline.next ();
            }
        });

    }
});

/*
 * @ Scope enchant.tl.ParallelAction
 */
enchant.tl.ParallelAction = enchant.Class.create (enchant.tl.Action, {
    /*
     * Action to perform actions in parallel.
     * I can have more than one child action.
     * @ Constructs
     * @ Extends enchant.tl.Action
     */
    initialize: function (param) {
        enchant.tl.Action.call (this, param);
        var timeline = this.timeline;
        var node = this.node;
        /*
         * Child action
         */
        this.actions = [];
        /*
         * Actions that have finished running
         */
        this.endedActions = [];
        var that = this;

        this.addEventListener (enchant.Event.ACTION_START, function (evt) {
            // When you start the concurrent
            for (var i = 0, len = that.actions.length; i <len; i + +) {
                . that.actions [i] dispatchEvent (evt);
            }
        });

        this.addEventListener (enchant.Event.ACTION_TICK, function (evt) {
            var i, len, timeline = {
                next: function () {
                    var action = that.actions [i];
                    that.actions.splice (i -, 1);
                    len = that.actions.length;
                    that.endedActions.push (action);

                    / / Send the event
                    var e = new enchant.Event ("actionend");
                    e.timeline = this;
                    action.dispatchEvent (e);

                    e = new enchant.Event ("removedfromtimeline");
                    e.timeline = this;
                    action.dispatchEvent (e);
                }
            };
            var e = new enchant.Event ("actiontick");
            e.timeline = timeline;
            for (i = 0, len = that.actions.length; i <len; i + +) {
                . that.actions [i] dispatchEvent (e);
            }
            / / To the following actions: Action remainder becomes 0
            if (that.actions.length == 0) {
                evt.timeline.next ();
            }
        });

        this.addEventListener (enchant.Event.ADDED_TO_TIMELINE, function (evt) {
            for (var i = 0, len = that.actions.length; i <len; i + +) {
                . that.actions [i] dispatchEvent (evt);
            }
        });

        this.addEventListener (enchant.Event.REMOVED_FROM_TIMELINE, function (evt) {
            / / Returns all
            this.actions = this.endedActions;
            this.endedActions = [];
        });

    }
});

/*
 * @ Scope enchant.tl.Tween
 */
enchant.tl.Tween = enchant.Class.create (enchant.tl.Action, {
    /*
     * Tween class.
     * Classes that extend the action easier to handle.
     * I used to when you want to change smoothly, certain properties of the object.
     *
     * Configuration object passed to the constructor, if you specify a target value of the property,
     * When the action is executed to generate actions such as changing the value of the target value until smooth.
     *
     * Even tween easing, can be specified in easing property.
     * The default is specified enchant.Easing.LINEAR.
     *
     * @ Param params
     * @ Config {time}
     * @ Config {easing} [function]
     */
    initialize: function (params) {
        var origin = {};
        var target = {};
        enchant.tl.Action.call (this, params);

        if (this.easing == null) {
            // Linear
            this.easing = function (t, b, c, d) {
                return c * t / d + b;
            };
        }

        var tween = this;
        this.addEventListener (enchant.Event.ACTION_START, function () {
            // Properties that do not qualify for the tween
            var excepted = ["frame", "time", "callback", "onactiontick", "onactionstart", "onactionend"];
            for (var prop in params) if (params.hasOwnProperty (prop)) {
                // Use the result of evaluating the function when instead of the value contained in
                var target_val;
                if (typeof params [prop] == "function") {
                    . target_val = params [prop] call (tween.node);
                } Else target_val = params [prop];

                if (excepted.indexOf (prop) == -1) {
                    origin [prop] = tween.node [prop];
                    target [prop] = target_val;
                }
            }
        });

        this.addEventListener (enchant.Event.ACTION_TICK, function (evt) {
            var ratio = tween.easing (tween.frame, 0, 1, tween.time);
            for (var prop in target) if (target.hasOwnProperty (prop)) {
                if (typeof this [prop] === "undefined") continue;
                var val = target [prop] * ratio + origin [prop] * (1 - ratio);
                if (prop === "x" | | prop === "y") {
                    tween.node [prop] = Math.round (val);
                } Else {
                    tween.node [prop] = val;
                }
            }
        });
    }
});

enchant.tl.Timeline = enchant.Class.create (enchant.EventTarget, {
    /*
     * Time-line class.
     * Class for managing the action.
     * For one node to manipulate the timeline of one must correspond.
     *
     * Reading a tl.enchant.js, all classes (Group, Scene, Entity, Label, Sprite) of the Node class that inherits
     Tl * the property, an instance of the Timeline class is generated.
     * Time-line class has a method to add a variety of actions to himself,
     * I can be animated and various operations by using these briefly.
     *
     Target node * @ param node operation
     */
    initialize: function (node) {
        enchant.EventTarget.call (this);
        this.node = node;
        this.queue = [];
        this.paused = false;
        this.looped = false;

        this._parallel = null;

        this.addEventListener (enchant.Event.ENTER_FRAME, this.tick);
    }
    /*
     * To end the action at the top of the queue, and then proceeds to the next action.
     * Can be called from within the action, I can also be called from the outside.
     *
     * If you are running the action, the action has been completed,
     * Because () function is called tick, in some cases more than one action is processed in one frame again.
     * Ex.
     * Sprite.tl.then (function A () {..}) then (function B () {..}).;
     * If you have written and will perform both functions A · B in the first frame
     *
     */
    next: function () {
        var e, action = this.queue.shift ();
        e = new enchant.Event ("actionend");
        e.timeline = this;
        action.dispatchEvent (e);

        if (this.looped) {
            e = new enchant.Event ("removedfromtimeline");
            e.timeline = this;
            action.dispatchEvent (e);

            // Re-add
            e = new enchant.Event ("addedtotimeline");
            e.timeline = this;
            action.dispatchEvent (e);

            this.add (action);
        } Else {
            // Discard the event by issuing
            e = new enchant.Event ("removedfromtimeline");
            e.timeline = this;
            action.dispatchEvent (e);
        }
        this.dispatchEvent (new enchant.Event ("enterframe"));
    }
    /*
     * Function to be registered as a listener for events of target enterframe
     * Action to perform when the elapsed 1 frame is written.
     * (For the action at the top of the queue, issue the actionstart / actiontick events)
     */
    tick: function () {
        if (this.queue.length> 0) {
            var action = this.queue [0];
            if (action.frame == 0) {
                e = new enchant.Event ("actionstart");
                e.timeline = this;
                action.dispatchEvent (e);
            }
            var e = new enchant.Event ("actiontick");
            e.timeline = this;
            action.dispatchEvent (e);
        }
    }
    add: function (action) {
        if (this._parallel) {
            this._parallel.actions.push (action);
            this._parallel = null;
        } Else {
            this.queue.push (action);
        }

        var e = new enchant.Event ("addedtotimeline");
        e.timeline = this;
        action.dispatchEvent (e);

        e = new enchant.Event ("actionadded");
        e.action = action;
        this.dispatchEvent (e);

        return this;
    }
    /*
     * Methods for you to easily add actions.
     * The entity of the add method wrappers.
     * @ Param params Configuration Object Action
     */
    action: function (params) {
        return this.add (new enchant.tl.Action (params));
    }
    /*
     * Methods for you to easily add a tween.
     * The entity of the add method wrappers.
     * @ Param params Configuration Object tween.
     */
    tween: function (params) {
        return this.add (new enchant.tl.Tween (params));
    }
    /*
     * Destroy all the queues in the timeline. End event will not be issued.
     */
    clear: function () {
        var e = new enchant.Event ("removedfromtimeline");
        e.timeline = this;

        for (var i = 0, len = this.queue.length; i <len; i + +) {
            . this.queue [i] dispatchEvent (e);
        }
        this.queue = [];
        return this;
    }
    /*
     * Fast forward the timeline.
     * Perform an instant, a process similar to the specified number of frames has elapsed and the.
     * I can not rewind.
     * @ Param frames
     */
    skip: function (frames) {
        while (frames -) {
            this.dispatchEvent (new enchant.Event ("enterframe"));
        }
        return this;
    }
    /*
     * Suspend the execution of the timeline
     */
    pause: function () {
        this.paused = false;
        return this;
    }
    /*
     * Resume execution of the timeline
     */
    resume: function () {
        this.paused = true;
        return this;
    }
    /*
     * To loop the timeline.
     * Action ends when the loop, after being removed from the timeline
     * Are added to the timeline again. This action leaves the loop have also been released.
     */
    loop: function () {
        this.looped = true;
        return this;
    }
    /*
     * Clear the loop in the timeline.
     */
    unloop: function () {
        this.looped = false;
        return this;
    }
    /*
     * Waits for the specified number of frames, add an action that does nothing.
     * @ Param time
     */
    delay: function (time) {
        this.add (new enchant.tl.Action ({
            time: time
        }));
        return this;
    }
    /*
     * @ Ignore
     * @ Param time
     */
    wait: function (time) {
        / / Reserved
        return this;
    }
    /*
     * Add the action to perform the function, move on to the next action immediately.
     * @ Param func
     */
    then: function (func) {
        var timeline = this;
        this.add (new enchant.tl.Action ({
                    onactionstart: func,
                    onactiontick: function (evt) {
                        timeline.next ();
                    }
                }));
        return this;
    }
    /*
     * Synonym of then method.
     * Run the function, move to the next action immediately.
     * @ Param func
     */
    exec: function (func) {
        this.then (func);
    }
    /*
     * Add specified more than once on the (object) associative array keyed by the number of frames, the function you want to perform.
     * Internally, we use delay, the then.
     *
     * @ Example
     * Sprite.tl.cue ({
     * 10: {function to be executed after the lapse of 10 frames} function) (,
     * 20: {function to be executed after the lapse of 20 frames} function) (,
     * 30: {function to be executed after the lapse of 30 frames} function) (
     *});
     * @ Param cue queue object
     */
    cue: function (cue) {
        var ptr = 0;
        for (var frame in cue) if (cue.hasOwnProperty (frame)) {
            this.delay (frame - ptr);
            this.then (cue [frame]);
            ptr = frame;
        }
    }
    /*
     * Adds an action to the specified number of frames repeat function.
     I want to execute a function * @ param func
     * @ Param time the number of frame duration
     */
    repeat: function (func, time) {
        this.add (new enchant.tl.Action ({
            onactiontick: function (evt) {
                func.call (this);
            }
            time: time
        }));
        return this;
    }
    /*
     * I want to specify when you want to perform multiple actions in parallel.
     * Do not migrate to the next action in the action all tied and until the end of the
     * @ Example
     * Sprite.tl.fadeIn (30) and.rotateBy (360, 30).;
     * Rotated 360 degrees while I fade in 30 frames
     */
    and: function () {
        var last = this.queue.pop ();
        if (last instanceof enchant.tl.ParallelAction) {
            this._parallel = last;
            this.queue.push (last);
        } Else {
            var parallel = new enchant.tl.ParallelAction ();
            parallel.actions.push (last)
            this.queue.push (parallel);
            this._parallel = parallel;
        }
        return this;
    }
    /*
     * @ Ignore
     */
    or: function () {
        return this;
    }
    /*
     * @ Ignore
     */
    doAll: function (children) {
        return this;
    }
    /*
     * @ Ignore
     */
    waitAll: function () {
        return this;
    }
    /*
     * Until it returns true value, and then add an action to perform the function for each frame.
     * @ Example
     * Sprite.tl.waitUntil (function () {
     * Return this.x-- <0
     *}) Then (function () {..}).;
     * / / Continue to subtract the coordinate frame x every x coordinate to become negative
     *
     I want to execute a function * @ param func
     */
    waitUntil: function (func) {
        var timeline = this;
        this.add (new enchant.tl.Action ({
                    onactionstart: func,
                    onactiontick: function (func) {
                        if (func.call (this)) {
                            timeline.next ();
                        }
                    }
                }));
        return this;
    }
    /*
     * Add an action to smoothly change the opacity of the Entity.
     * @ Param opacity The opacity of the target
     * @ Param time the number of frames
     * @ Param function [easing] easing
     */
    fadeTo: function (opacity, time, easing) {
        this.tween ({
            opacity: opacity,
            time: time,
            easing: easing
        });
        return this;
    }
    /*
     * Add the action to fade in the Entity.
     * FadeTo alias (1).
     * @ Param time the number of frames
     * @ Param function [easing] easing
     */
    fadeIn: function (time, easing) {
        return this.fadeTo (1, time, easing);
    }
    /*
     * Add an action to fade out the Entity.
     * FadeTo alias (1).
     * @ Param time the number of frames
     * @ Param function [easing] easing
     */
    fadeOut: function (time, easing) {
        return this.fadeTo (0, time, easing);
    }
    /*
     * Add the action to move smoothly the position of the Entity.
     * @ Param x The x-coordinate of the target
     * @ Param y The y-coordinate of the target
     * @ Param time the number of frames
     * @ Param function [easing] easing
     */
    moveTo: function (x, y, time, easing) {
        return this.tween ({
            x: x,
            y: y,
            time: time,
            easing: easing
        });
    }
    /*
     * Add the actions that smoothly changes the x coordinate of the Entity.
     * @ Param x
     * @ Param time
     * @ Param [easing]
     */
    moveX: function (x, time, easing) {
        return this.tween ({
            x: x,
            time: time,
            easing: easing
        });
    }
    /*
     * Add the actions that smoothly changes the y coordinate of the Entity.
     * @ Param y
     * @ Param time
     * @ Param [easing]
     */
    moveY: function (y, time, easing) {
        return this.tween ({
            y: y,
            time: time,
            easing: easing
        });
    }
    /*
     * Add the actions that smoothly changes the position of the Entity.
     * The coordinates are specified in relative coordinates from the start of the action.
     * @ Param x
     * @ Param y
     * @ Param time
     * @ Param [easing]
     */
    moveBy: function (x, y, time, easing) {
        return this.tween ({
            x: function () {return this.x + x},
            y: function () {return this.y + y},
            time: time,
            easing: easing
        });
    }
    /*
     * To 0 opacity of Entity (immediate)
     */
    hide: function () {
        return this.then (function () {
            this.opacity = 0;
        });
    }
    /*
     * To 1 opacity of the Entity (immediate)
     */
    show: function () {
        return this.then (function () {
            this.opacity = 1;
        });
    }
    /*
     * Removed from the scene the Entity.
     * If it has been removed from the scene, you will not be called enterframe event,
     * Note that this also stops the timeline.
     * After this action is not executed until it is added to the scene again.
     */
    removeFromScene: function () {
        return this.then (function () {
            this.scene.removeChild (this);
        });
    }
    /*
     * Add the action to scale smoothly Entity.
     * @ Param scale relative scale
     * @ Param time
     * @ Param [easing]
     */
    scaleTo: function (scale, time, easing) {
        return this.tween ({
            scaleX: scale,
            scaleY: scale,
            time: time,
            easing: easing
        });
    }
    /*
     * Add the action to scale smoothly Entity.
     * Specified by (n times at the beginning of the scale of the action ex.) relative scale.
     * @ Param scale relative scale
     * @ Param time
     * @ Param [easing]
     */
    scaleBy: function (scale, time, easing) {
        return this.tween ({
            scaleX: function () {return this.scaleX * scale},
            scaleY: function () {return this.scaleY * scale},
            time: time,
            easing: easing
        })
    }
    /*
     * Add an action to rotate smoothly the Entity.
     Angle of rotation of the target * @ param deg (radian measure: 360 and 1 rotation)
     * @ Param time the number of frames
     * @ Param function [easing] easing
     */
    rotateTo: function (deg, time, easing) {
        return this.tween ({
            rotation: deg,
            time: time,
            easing: easing
        });
    }
    /*
     * Add an action to rotate smoothly the Entity.
     * The angle specified by (n degree angle at the start of further action) relative angle
     * Relative angle of the target @ param deg (radian measure: 360 and 1 rotation)
     * @ Param time the number of frames
     * @ Param function [easing] easing
     */
    rotateBy: function (deg, time, easing) {
        return this.tween ({
            rotation: function () {return this.rotation + deg},
            time: time,
            easing: easing
        })
    }});

/*
 * ================================================= ===========================================
 * Easing Equations v2.0
 * September 1, 2003
 * (C) 2003 Robert Penner, all rights reserved.
 * This work is subject to the terms in http://www.robertpenner.com/easing_terms_of_use.html.
 * ================================================= ===========================================
 */

/*
 * Easing function library
 * Widely used in ActionScript
 * I was ported to JavaScript to Easing Equations by Robert Penner.
 * @ Scope enchant.Easing
 */
enchant.Easing = {
    LINEAR: function (t, b, c, d) {
        return c * t / d + b;
    }
    // Quad
    QUAD_EASEIN: function (t, b, c, d) {
        return c * (t / = d) * t + b;
    }
    QUAD_EASEOUT: function (t, b, c, d) {
        return-c * (t / = d) * (t - 2) + b;
    }
    QUAD_EASEINOUT: function (t, b, c, d) {
        if ((t / = d / 2) <1) return c / 2 * t * t + b;
        return-c / 2 * ((- t) * (t - 2) - 1) + b;
    }
    // Cubic
    CUBIC_EASEIN: function (t, b, c, d) {
        return c * (t / = d) * t * t + b;
    }
    CUBIC_EASEOUT: function (t, b, c, d) {
        return c * ((t = t / d - 1) * t * t + 1) + b;
    }
    CUBIC_EASEINOUT: function (t, b, c, d) {
        if ((t / = d / 2) <1) return c / 2 * t * t * t + b;
        return c / 2 * ((t - = 2) * t * t + 2) + b;
    }
    // Quart
    QUART_EASEIN: function (t, b, c, d) {
        return c * (t / = d) * t * t * t + b;
    }
    QUART_EASEOUT: function (t, b, c, d) {
        return-c * ((t = t / d - 1) * t * t * t - 1) + b;
    }
    QUART_EASEINOUT: function (t, b, c, d) {
        if ((t / = d / 2) <1) return c / 2 * t * t * t * t + b;
        return-c / 2 * ((t - = 2) * t * t * t - 2) + b;
    }
    // Quint
    QUINT_EASEIN: function (t, b, c, d) {
        return c * (t / = d) * t * t * t * t + b;
    }
    QUINT_EASEOUT: function (t, b, c, d) {
        return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
    }
    QUINT_EASEINOUT: function (t, b, c, d) {
        if ((t / = d / 2) <1) return c / 2 * t * t * t * t * t + b;
        return c / 2 * ((t - = 2) * t * t * t * t + 2) + b;
    }
    // Sin
    SIN_EASEIN: function (t, b, c, d) {
        return-c * Math.cos (t / d * (Math.PI / 2)) + c + b;
    }
    SIN_EASEOUT: function (t, b, c, d) {
        return c * Math.sin (t / d * (Math.PI / 2)) + b;
    }
    SIN_EASEINOUT: function (t, b, c, d) {
        return-c / 2 * (Math.cos (Math.PI * t / d) - 1) + b;
    }
    // Circ
    CIRC_EASEIN: function (t, b, c, d) {
        return-c * (Math.sqrt (1 - (t / = d) * t) - 1) + b;
    }
    CIRC_EASEOUT: function (t, b, c, d) {
        return c * Math.sqrt (1 - (t = t / d - 1) * t) + b;
    }
    CIRC_EASEINOUT: function (t, b, c, d) {
        if ((t / = d / 2) <1) return-c / 2 * (Math.sqrt (1 - t * t) - 1) + b;
        return c / 2 * (Math.sqrt (1 - (t - = 2) * t) + 1) + b;
    }
    // Elastic
    ELASTIC_EASEIN: function (t, b, c, d, a, p) {
        if (t == 0) return b;
        if ((t / = d) == 1) return b + c;
        if (! p) p = d * .3;
        if (a |! | a <Math.abs (c)) {
            a = c;
            var s = p / 4;
        }
        else var s = p / (2 * Math.PI) * Math.asin (c / a);
        return - (a * Math.pow (2, 10 * (t - = 1)) * Math.sin ((t * d - s) * (2 * Math.PI) / p)) + b;
    }
    ELASTIC_EASEOUT: function (t, b, c, d, a, p) {
        if (t == 0) return b;
        if ((t / = d) == 1) return b + c;
        if (! p) p = d * .3;
        if (a |! | a <Math.abs (c)) {
            a = c;
            var s = p / 4;
        }
        else var s = p / (2 * Math.PI) * Math.asin (c / a);
        return (a * Math.pow (2, -10 * t) * Math.sin ((t * d - s) * (2 * Math.PI) / p) + c + b);
    }
    ELASTIC_EASEINOUT: function (t, b, c, d, a, p) {
        if (t == 0) return b;
        if ((t / = d / 2) == 2) return b + c;
        if (! p) p = d * (.3 * 1.5);
        if (a |! | a <Math.abs (c)) {
            a = c;
            var s = p / 4;
        }
        else var s = p / (2 * Math.PI) * Math.asin (c / a);
        if (t <1) return - .5 * (a * Math.pow (2, 10 * (t - = 1)) * Math.sin ((t * d - s) * (2 * Math.PI) / p)) + b;
        return a * Math.pow (2, -10 * (t - = 1)) * Math.sin ((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
    }
    // Bounce
    BOUNCE_EASEOUT: function (t, b, c, d) {
        if ((t / = d) <(1 / 2.75)) {
            return c * (7.5625 * t * t) + b;
        } Else if (t <(2 / 2.75)) {
            return c * (7.5625 * (t - = (1.5 / 2.75)) * t + .75) + b;
        } Else if (t <(2.5 / 2.75)) {
            return c * (7.5625 * (t - = (2.25 / 2.75)) * t + .9375) + b;
        } Else {
            return c * (7.5625 * (t - = (2.625 / 2.75)) * t + .984375) + b;
        }
    }
    BOUNCE_EASEIN: function (t, b, c, d) {
        return c - enchant.Easing.BOUNCE_EASEOUT (d - t, 0, c, d) + b;
    }
    BOUNCE_EASEINOUT: function (t, b, c, d) {
        if (t <d / 2) return enchant.Easing.BOUNCE_EASEIN (t * 2, 0, c, d) * .5 + b;
        else return enchant.Easing.BOUNCE_EASEOUT (t * 2 - d, 0, c, d) * .5 + c * .5 + b;
    }
    // Back
    BACK_EASEIN: function (t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        return c * (t / = d) * t * ((s + 1) * t - s) + b;
    }
    BACK_EASEOUT: function (t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
    }
    BACK_EASEINOUT: function (t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        if ((t / = d / 2) <1) return c / 2 * (t * t * (((s * = (1.525)) + 1) * t - s)) + b;
        return c / 2 * ((t - = 2) * t * (((s * = (1.525)) + 1) * t + s) + 2) + b;
    }
    // Expo
    EXPO_EASEIN: function (t, b, c, d) {
        ? return (t == 0) b: c * Math.pow (2, 10 * (t / d - 1)) + b;
    }
    EXPO_EASEOUT: function (t, b, c, d) {
        ? return (t == d) b + c: c * (-Math.pow (2, -10 * t / d) + 1) + b;
    }
    EXPO_EASEINOUT: function (t, b, c, d) {
        if (t == 0) return b;
        if (t == d) return b + c;
        if ((t / = d / 2) <1) return c / 2 * Math.pow (2, 10 * (t - 1)) + b;
        return c / 2 * (-Math.pow (2, -10 * - t) + 2) + b;
    }
};

/**
 * Easing Equations v2.0
 */
