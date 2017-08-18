// if the module has no dependencies, the above pattern can be simplified to
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.olPlot = factory();
  }
}(this, function () {
  var olPlot = {}
  return olPlot
}));
olPlot.Constants = {
  TWO_PI: Math.PI * 2,
  HALF_PI: Math.PI / 2,
  FITTING_COUNT: 100,
  ZERO_TOLERANCE: 0.0001
};

olPlot.Utils = {
    _stampId: 0
};

olPlot.Utils.trim = function(str) {
    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
};

olPlot.Utils.stamp = function(obj) {
    var key = '_p_id_';
    obj[key] = obj[key] || this._stampId++;
    return obj[key];
};

olPlot.Utils.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }
}

olPlot.Utils.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  /** @override */
  childCtor.prototype.constructor = childCtor;
  childCtor.base = function(me, methodName, var_args) {
    var args = Array.prototype.slice.call(arguments, 2);
    return parentCtor.prototype[methodName].apply(me, args);
  };
}

olPlot.Utils.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if (caller.superClass_) {
    // This is a constructor. Call the superclass constructor.
    return caller.superClass_.constructor.apply(
      me, Array.prototype.slice.call(arguments, 1));
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for (var ctor = me.constructor;
       ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else if (foundCaller) {
      return ctor.prototype[opt_methodName].apply(me, args);
    }
  }
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error(
      'base called from a method of one name ' +
      'to a method of a different name');
  }
}

olPlot.DomUtils = {};

olPlot.DomUtils.create = function (tagName, className, parent, id) {
  var element = document.createElement(tagName);
  element.className = className || '';
  if (id) {
    element.id = id;
  }
  if (parent) {
    parent.appendChild(element);
  }
  return element;
};

olPlot.DomUtils.createHidden = function (tagName, parent, id) {
  var element = document.createElement(tagName);
  element.style.display = 'none';
  if (id) {
    element.id = id;
  }
  if (parent) {
    parent.appendChild(element);
  }
  return element;
};

olPlot.DomUtils.remove = function (element, parent) {
  if (parent && element) {
    parent.removeChild(element);
  }
};

olPlot.DomUtils.get = function (id) {
  return document.getElementById(id);
};

olPlot.DomUtils.getStyle = function (element, name) {
  var value = element.style[name];
  return value === 'auto' ? null : value;
};

olPlot.DomUtils.hasClass = function (element, name) {
  return (element.className.length > 0) &&
    new RegExp('(^|\\s)' + name + '(\\s|$)').test(element.className);
};

olPlot.DomUtils.addClass = function (element, name) {
  if (this.hasClass(element, name)) {
    return;
  }
  if (element.className) {
    element.className += ' ';
  }
  element.className += name;
};

olPlot.DomUtils.removeClass = function (element, name) {
  element.className = olPlot.Utils.trim((' ' + element.className + ' ').replace(' ' + name + ' ', ' '));
};

olPlot.DomUtils.getDomEventKey = function (type, fn, context) {
  return '_p_dom_event_' + type + '_' + olPlot.Utils.stamp(fn) + (context ? '_' + olPlot.Utils.stamp(context) : '');
};

olPlot.DomUtils.addListener = function (element, type, fn, context) {
  var self = this,
    eventKey = olPlot.DomUtils.getDomEventKey(type, fn, context),
    handler = element[eventKey];

  if (handler) {
    return self;
  }

  handler = function (e) {
    return fn.call(context || element, e);
  };

  if ('addEventListener' in element) {
    element.addEventListener(type, handler, false);
  } else if ('attachEvent' in element) {
    element.attachEvent('on' + type, handler);
  }

  element[eventKey] = handler;
  return self;
};

olPlot.DomUtils.removeListener = function (element, type, fn, context) {
  var self = this,
    eventKey = olPlot.DomUtils.getDomEventKey(type, fn, context),
    handler = element[eventKey];

  if (!handler) {
    return self;
  }

  if ('removeEventListener' in element) {
    element.removeEventListener(type, handler, false);
  } else if ('detachEvent' in element) {
    element.detachEvent('on' + type, handler);
  }

  element[eventKey] = null;

  return self;
};
olPlot.Event = {};

olPlot.Event.EventType = {};
olPlot.Event.EventType.MOUSEMOVE = 'mousemove';
olPlot.Event.EventType.MOUSEUP = 'mouseup';
olPlot.Event.EventType.MOUSEDOWN = 'mousedown';
olPlot.Event.EventType.DRAW_START = "draw_start";
olPlot.Event.EventType.DRAW_END = "draw_end";
olPlot.Event.EventType.EDIT_START = "edit_start";
olPlot.Event.EventType.EDIT_END = "edit_end";

/**
 * 绑定事件
 * @param listenerObj
 * @returns {boundListener}
 * @private
 */
olPlot.Event.bindListener = function (listenerObj) {
  var boundListener = function (evt) {
    var listener = listenerObj.listener
    var bindTo = listenerObj.bindTo || listenerObj.target
    if (listenerObj.callOnce) {
      olPlot.Event.unListenByKey(listenerObj)
    }
    return listener.call(bindTo, evt)
  }
  listenerObj.boundListener = boundListener
  return boundListener
}

/**
 * 查找监听器
 * @param listeners
 * @param listener
 * @param optThis
 * @param optSetDevareIndex
 * @returns {*}
 */
olPlot.Event.findListener = function (listeners, listener, optThis, optSetDevareIndex) {
  var listenerObj = null
  for (var i = 0, ii = listeners.length; i < ii; ++i) {
    listenerObj = listeners[i]
    if (listenerObj.listener === listener && listenerObj.bindTo === optThis) {
      if (optSetDevareIndex) {
        listenerObj.devareIndex = i
      }
      return listenerObj
    }
  }
  return undefined
}

/**
 * get Listeners
 * @param target
 * @param type
 * @returns {undefined}
 */
olPlot.Event.getListeners = function (target, type) {
  var listenerMap = target.vlm
  return listenerMap ? listenerMap[type] : undefined
}

/**
 * Get the lookup of listeners.  If one does not exist on the target, it is
 * @param target
 * @returns {{}|*}
 * @private
 */
olPlot.Event.getListenerMap = function (target) {
  var listenerMap = target.vlm
  if (!listenerMap) {
    listenerMap = target.vlm = {}
  }
  return listenerMap
}

/**
 * 清空事件
 * @param target
 * @param type
 */
olPlot.Event.removeListeners = function (target, type) {
  var listeners = olPlot.Event.getListeners(target, type)
  if (listeners) {
    for (var i = 0, ii = listeners.length; i < ii; ++i) {
      target.removeEventListener(type, listeners[i].boundListener)
      olPlot.Event.clear(listeners[i])
    }
    listeners.length = 0
    var listenerMap = target.vlm
    if (listenerMap) {
      delete listenerMap[type]
      if (Object.keys(listenerMap).length === 0) {
        delete target.vlm
      }
    }
  }
}

/**
 * 注册事件处理
 * @param target
 * @param type
 * @param listener
 * @param optThis
 * @param optOnce
 * @returns {*}
 */
olPlot.Event.listen = function (target, type, listener, optThis, optOnce) {
  var listenerMap = olPlot.Event.getListenerMap(target)
  var listeners = listenerMap[type]
  if (!listeners) {
    listeners = listenerMap[type] = []
  }
  var listenerObj = olPlot.Event.findListener(listeners, listener, optThis, false)
  if (listenerObj) {
    if (!optOnce) {
      listenerObj.callOnce = false
    }
  } else {
    listenerObj = ({
      bindTo: optThis,
      callOnce: !!optOnce,
      listener: listener,
      target: target,
      type: type
    })
    target.addEventListener(type, olPlot.Event.bindListener(listenerObj))
    listeners.push(listenerObj)
  }
  return listenerObj
}

/**
 * 注册事件，只触发一次
 * @param target
 * @param type
 * @param listener
 * @param optThis
 * @returns {*}
 */
olPlot.Event.listenOnce = function (target, type, listener, optThis) {
  return olPlot.Event.listen(target, type, listener, optThis, true)
}

/**
 * 取消事件注册
 * @param target
 * @param type
 * @param listener
 * @param optThis
 */
olPlot.Event.unListen = function (target, type, listener, optThis) {
  var listeners = olPlot.Event.getListeners(target, type)
  if (listeners) {
    var listenerObj = olPlot.Event.findListener(listeners, listener, optThis, true)
    if (listenerObj) {
      olPlot.Event.unListenByKey(listenerObj)
    }
  }
}

/**
 * 根据事件名移除事件对象
 * @param key
 */
olPlot.Event.unListenByKey = function (key) {
  if (key && key.target) {
    key.target.removeEventListener(key.type, key.boundListener)
    var listeners = olPlot.Event.getListeners(key.target, key.type)
    if (listeners) {
      var i = 'deleteIndex' in key ? key.devareIndex : listeners.indexOf(key)
      if (i !== -1) {
        listeners.splice(i, 1)
      }
      if (listeners.length === 0) {
        olPlot.Event.removeListeners(key.target, key.type)
      }
    }
    olPlot.Event.clear(key)
  }
}

/**
 * 清空当前对象
 * @param object
 */
olPlot.Event.clear = function (object) {
  for (var property in object) {
    delete object[property]
  }
}

/**
 * 移除所有事件监听
 * @param target
 */
olPlot.Event.unlistenAll = function (target) {
  var listenerMap = olPlot.Event.getListenerMap(target)
  for (var type in listenerMap) {
    olPlot.Event.removeListeners(target, type)
  }
}

/**
 * 获取事件唯一标识
 * @param type
 * @param fn
 * @param context
 * @returns {string}
 */
olPlot.Event.getDomEventKey = function (type, fn, context) {
  return '_dom_event_' + type + '_' + olPlot.Utils.stamp(fn) + (context ? '_' + olPlot.Utils.stamp(context) : '')
}

/**
 * 对DOM对象添加事件监听
 * @param element
 * @param type
 * @param fn
 * @param context
 * @returns {*}
 */
olPlot.Event.addListener = function (element, type, fn, context) {
  var eventKey = olPlot.Event.getDomEventKey(type, fn, context)
  var handler = element[eventKey]
  if (handler) {
    return this
  }
  handler = function (e) {
    return fn.call(context || element, e)
  }
  if ('addEventListener' in element) {
    element.addEventListener(type, handler, false)
  } else if ('attachEvent' in element) {
    element.attachEvent('on' + type, handler)
  }
  element[eventKey] = handler
  return this
}

/**
 * 移除DOM对象监听事件
 * @param element
 * @param type
 * @param fn
 * @param context
 * @returns {removeListener}
 */
olPlot.Event.removeListener = function (element, type, fn, context) {
  var eventKey = olPlot.Event.getDomEventKey(type, fn, context)
  var handler = element[eventKey]
  if (!handler) {
    return this
  }
  if ('removeEventListener' in element) {
    element.removeEventListener(type, handler, false)
  } else if ('detachEvent' in element) {
    element.detachEvent('on' + type, handler)
  }
  element[eventKey] = null
  return this
}

olPlot.Event.Observable = function () {
  this.Events = {}
  this.__cnt = 0
}

olPlot.Event.Observable.hasOwnKey = Function.call.bind(Object.hasOwnProperty)

olPlot.Event.Observable.slice = Function.call.bind(Array.prototype.slice)

/**
 * 事件分发
 * @param eventName
 * @param callback
 * @param context
 * @returns {(*|*)[]}
 */
olPlot.Event.Observable.prototype.on = function (eventName, callback, context) {
  return (this.bindEvent(eventName, callback, 0, context))
}

/**
 * 取消监听
 * @param event
 * @returns {boolean}
 */
olPlot.Event.Observable.prototype.un = function (event) {
  var eventName = '', key = '', r = false, type = (typeof event)
  var that = this
  if (type === 'string') {
    if (olPlot.Event.Observable.hasOwnKey(this.Events, event)) {
      delete this.Events[event]
      return true
    }
    return false
  } else if (type === 'object') {
    eventName = event[0]
    key = event[1]
    if (olPlot.Event.Observable.hasOwnKey(this.Events, eventName) && olPlot.Event.Observable.hasOwnKey(this.Events[eventName], key)) {
      delete this.Events[eventName][key]
      return true
    }
    return false
  } else if (type === 'function') {
    that.eachEvent(that.Events, function (keyA, itemA) {
      that.eachEvent(itemA, function (keyB, itemB) {
        if (itemB[0] === event) {
          delete that.Events[keyA][keyB]
          r = true
        }
      })
    })
    return r
  }
  return true
}

/**
 * 事件监听（只触发一次）
 * @param eventName
 * @param callback
 * @param context
 * @returns {(*|*)[]}
 */
olPlot.Event.Observable.prototype.once = function (eventName, callback, context) {
  return (this.bindEvent(eventName, callback, 1, context))
}

/**
 * 响应事件
 * @param eventName
 * @param args
 */
olPlot.Event.Observable.prototype.action = function (eventName, args) {
  if (olPlot.Event.Observable.hasOwnKey(this.Events, eventName)) {
    this.eachEvent(this.Events[eventName], function (key, item) {
      item[0].apply(item[2], args)
      if (item[1]) {
      delete this.Events[eventName][key]
    }
  })
  }
}

/**
 * 实时触发响应
 * @param eventName
 */
olPlot.Event.Observable.prototype.dispatch = function (eventName) {
  var that = this
  var args = olPlot.Event.Observable.slice(arguments, 1)
  setTimeout(function () {
    that.action(eventName, args)
  })
}

/**
 * 延后触发响应
 * @param eventName
 */
olPlot.Event.Observable.prototype.dispatchSync = function (eventName) {
  this.action(eventName, olPlot.Event.Observable.slice(arguments, 1))
}

/**
 * 清空发布中心
 */
olPlot.Event.Observable.prototype.clear = function () {
  this.Events = {}
}

/**
 * 绑定事件
 * @param eventName
 * @param callback
 * @param isOne
 * @param context
 * @returns {[*,*]}
 */
olPlot.Event.Observable.prototype.bindEvent = function (eventName, callback, isOne, context) {
  if (typeof eventName !== 'string' || typeof callback !== 'function') {
    throw new Error('传入的事件名称和回调函数有误！')
  }
  if (!olPlot.Event.Observable.hasOwnKey(this.Events, eventName)) {
    this.Events[eventName] = {}
  }
  this.Events[eventName][++this.__cnt] = [callback, isOne, context]
  return [eventName, this.__cnt]
}

/**
 * 循环触发事件
 * @param obj
 * @param callback
 */
olPlot.Event.Observable.prototype.eachEvent = function (obj, callback) {
  for (var key in obj) {
    if (olPlot.Event.Observable.hasOwnKey(obj, key)) {
      callback(key, obj[key])
    }
  }
}
olPlot.PlotTypes = {
  ARC: "arc",
  ELLIPSE: "ellipse",
  CURVE: "curve",
  CLOSED_CURVE: "closedcurve",
  LUNE: "lune",
  SECTOR: "sector",
  GATHERING_PLACE: "gatheringplace",
  STRAIGHT_ARROW: "straightarrow",
  ASSAULT_DIRECTION: "assaultdirection",
  ATTACK_ARROW: "attackarrow",
  TAILED_ATTACK_ARROW: "tailedattackarrow",
  SQUAD_COMBAT: "squadcombat",
  TAILED_SQUAD_COMBAT: "tailedsquadcombat",
  FINE_ARROW: "finearrow",
  CIRCLE: "circle",
  DOUBLE_ARROW: "doublearrow",
  POLYLINE: "polyline",
  FREEHAND_LINE: "freehandline",
  POLYGON: "polygon",
  FREEHAND_POLYGON: "freehandpolygon",
  RECTANGLE: "rectangle",
  MARKER: "marker",
  TRIANGLE: "triangle"
};

olPlot.PlotUtils = {};

olPlot.PlotUtils.distance = function(pnt1, pnt2){
    return Math.sqrt(Math.pow((pnt1[0] - pnt2[0]), 2) + Math.pow((pnt1[1] - pnt2[1]), 2));
};

olPlot.PlotUtils.wholeDistance = function(points){
    var distance = 0;
    for(var i=0; i<points.length-1; i++)
    distance += olPlot.PlotUtils.distance(points[i], points[i+1]);
    return distance;
};

olPlot.PlotUtils.getBaseLength = function(points){
    return Math.pow(olPlot.PlotUtils.wholeDistance(points), 0.99);
    //return olPlot.PlotUtils.wholeDistance(points);
};

olPlot.PlotUtils.mid = function(pnt1, pnt2){
    return [(pnt1[0]+pnt2[0])/2, (pnt1[1]+pnt2[1])/2];
};

olPlot.PlotUtils.getCircleCenterOfThreePoints = function(pnt1, pnt2, pnt3){
    var pntA = [(pnt1[0]+pnt2[0])/2, (pnt1[1]+pnt2[1])/2];
    var pntB = [pntA[0]-pnt1[1]+pnt2[1], pntA[1]+pnt1[0]-pnt2[0]];
    var pntC = [(pnt1[0]+pnt3[0])/2, (pnt1[1]+pnt3[1])/2];
    var pntD = [pntC[0]-pnt1[1]+pnt3[1], pntC[1]+pnt1[0]-pnt3[0]];
    return olPlot.PlotUtils.getIntersectPoint(pntA, pntB, pntC, pntD);
};

olPlot.PlotUtils.getIntersectPoint = function(pntA, pntB, pntC, pntD){
    if(pntA[1] == pntB[1]){
        var f = (pntD[0]-pntC[0])/(pntD[1]-pntC[1]);
        var x = f*(pntA[1]-pntC[1])+pntC[0];
        var y = pntA[1];
        return [x, y];
    }
    if(pntC[1] == pntD[1]){
        var e = (pntB[0]-pntA[0])/(pntB[1]-pntA[1]);
        x = e*(pntC[1]-pntA[1])+pntA[0];
        y = pntC[1];
        return [x, y];
    }
    e = (pntB[0]-pntA[0])/(pntB[1]-pntA[1]);
    f = (pntD[0]-pntC[0])/(pntD[1]-pntC[1]);
    y = (e*pntA[1]-pntA[0]-f*pntC[1]+pntC[0])/(e-f);
    x = e*y-e*pntA[1]+pntA[0];
    return [x, y];
};

olPlot.PlotUtils.getAzimuth = function(startPnt, endPnt){
    var azimuth;
    var angle=Math.asin(Math.abs(endPnt[1] - startPnt[1]) / olPlot.PlotUtils.distance(startPnt, endPnt));
    if (endPnt[1] >= startPnt[1] && endPnt[0] >= startPnt[0])
        azimuth=angle + Math.PI;
    else if (endPnt[1] >= startPnt[1] && endPnt[0] < startPnt[0])
        azimuth=olPlot.Constants.TWO_PI - angle;
    else if (endPnt[1] < startPnt[1] && endPnt[0] < startPnt[0])
        azimuth=angle;
    else if (endPnt[1] < startPnt[1] && endPnt[0] >= startPnt[0])
        azimuth=Math.PI - angle;
    return azimuth;
};

olPlot.PlotUtils.getAngleOfThreePoints = function(pntA, pntB, pntC){
    var angle=olPlot.PlotUtils.getAzimuth(pntB, pntA) - olPlot.PlotUtils.getAzimuth(pntB, pntC);
    return (angle<0 ? angle + olPlot.Constants.TWO_PI : angle);
};

olPlot.PlotUtils.isClockWise = function(pnt1, pnt2, pnt3){
    return ((pnt3[1]-pnt1[1])*(pnt2[0]-pnt1[0]) > (pnt2[1]-pnt1[1])*(pnt3[0]-pnt1[0]));
};

olPlot.PlotUtils.getPointOnLine = function(t, startPnt, endPnt){
    var x = startPnt[0] + (t * (endPnt[0] - startPnt[0]));
    var y = startPnt[1] + (t * (endPnt[1] - startPnt[1]));
    return [x, y];
};

olPlot.PlotUtils.getCubicValue = function(t, startPnt, cPnt1, cPnt2, endPnt){
    t = Math.max(Math.min(t, 1), 0);
    var tp = 1 - t;
    var t2 = t * t;
    var t3 = t2 * t;
    var tp2 = tp * tp;
    var tp3 = tp2 * tp;
    var x = (tp3*startPnt[0]) + (3*tp2*t*cPnt1[0]) + (3*tp*t2*cPnt2[0]) + (t3*endPnt[0]);
    var y = (tp3*startPnt[1]) + (3*tp2*t*cPnt1[1]) + (3*tp*t2*cPnt2[1]) + (t3*endPnt[1]);
    return [x, y];
};

olPlot.PlotUtils.getThirdPoint = function(startPnt, endPnt, angle, distance, clockWise){
    var azimuth=olPlot.PlotUtils.getAzimuth(startPnt, endPnt);
    var alpha = clockWise ? azimuth+angle : azimuth-angle;
    var dx=distance * Math.cos(alpha);
    var dy=distance * Math.sin(alpha);
    return [endPnt[0] + dx, endPnt[1] + dy]; 
};

olPlot.PlotUtils.getArcPoints = function(center, radius, startAngle, endAngle){
    var x, y, pnts=[];
    var angleDiff = endAngle - startAngle;
    angleDiff = angleDiff < 0 ? angleDiff + olPlot.Constants.TWO_PI : angleDiff;
    for (var i=0; i<=olPlot.Constants.FITTING_COUNT; i++)
    {
        var angle = startAngle + angleDiff * i / olPlot.Constants.FITTING_COUNT;
        x=center[0] + radius * Math.cos(angle);
        y=center[1] + radius * Math.sin(angle);
        pnts.push([x, y]);
    }
    return pnts;
};

olPlot.PlotUtils.getBisectorNormals = function(t, pnt1, pnt2, pnt3){
    var normal = olPlot.PlotUtils.getNormal(pnt1, pnt2, pnt3);
    var dist = Math.sqrt(normal[0]*normal[0] + normal[1]*normal[1]);
    var uX = normal[0]/dist;
    var uY = normal[1]/dist;
    var d1 = olPlot.PlotUtils.distance(pnt1, pnt2);
    var d2 = olPlot.PlotUtils.distance(pnt2, pnt3);
    if(dist > olPlot.Constants.ZERO_TOLERANCE){
        if(olPlot.PlotUtils.isClockWise(pnt1, pnt2, pnt3)){
            var dt = t * d1;
            var x = pnt2[0] - dt*uY;
            var y = pnt2[1] + dt*uX;
            var bisectorNormalRight = [x, y];
            dt = t * d2;
            x = pnt2[0] + dt*uY;
            y = pnt2[1] - dt*uX;
            var bisectorNormalLeft = [x, y];
        }
        else{
            dt = t * d1;
            x = pnt2[0] + dt*uY;
            y = pnt2[1] - dt*uX;
            bisectorNormalRight = [x, y];
            dt = t * d2;
            x = pnt2[0] - dt*uY;
            y = pnt2[1] + dt*uX;
            bisectorNormalLeft = [x, y];
        }
    }
    else{
        x = pnt2[0] + t*(pnt1[0] - pnt2[0]);
        y = pnt2[1] + t*(pnt1[1] - pnt2[1]);
        bisectorNormalRight = [x, y];
        x = pnt2[0] + t*(pnt3[0] - pnt2[0]);
        y = pnt2[1] + t*(pnt3[1] - pnt2[1]);
        bisectorNormalLeft = [x, y];
    }
    return [bisectorNormalRight, bisectorNormalLeft];
};

olPlot.PlotUtils.getNormal = function(pnt1, pnt2, pnt3){
    var dX1 = pnt1[0] - pnt2[0];
    var dY1 = pnt1[1] - pnt2[1];
    var d1 = Math.sqrt(dX1*dX1 + dY1*dY1);
    dX1 /= d1;
    dY1 /= d1;

    var dX2 = pnt3[0] - pnt2[0];
    var dY2 = pnt3[1] - pnt2[1];
    var d2 = Math.sqrt(dX2*dX2 + dY2*dY2);
    dX2 /= d2;
    dY2 /= d2;

    var uX = dX1 + dX2;
    var uY = dY1 + dY2;
    return [uX, uY];
};

olPlot.PlotUtils.getCurvePoints = function(t, controlPoints){
    var leftControl = olPlot.PlotUtils.getLeftMostControlPoint(controlPoints);
    var normals = [leftControl];
    for(var i=0; i<controlPoints.length-2; i++){
        var pnt1 = controlPoints[i];
        var pnt2 = controlPoints[i+1];
        var pnt3 = controlPoints[i+2];
        var normalPoints = olPlot.PlotUtils.getBisectorNormals(t, pnt1, pnt2, pnt3);
        normals = normals.concat(normalPoints);
    }
    var rightControl = olPlot.PlotUtils.getRightMostControlPoint(controlPoints);
    normals.push(rightControl);
    var points = [];
    for(i=0; i<controlPoints.length-1; i++){
        pnt1 = controlPoints[i];
        pnt2 = controlPoints[i+1];
        points.push(pnt1);
        for(var t=0; t<olPlot.Constants.FITTING_COUNT; t++){
            var pnt = olPlot.PlotUtils.getCubicValue(t/olPlot.Constants.FITTING_COUNT, pnt1, normals[i*2], normals[i*2+1], pnt2);
            points.push(pnt);
        }
        points.push(pnt2);
    }
    return points;
};

olPlot.PlotUtils.getLeftMostControlPoint = function(controlPoints){
    var pnt1 = controlPoints[0];
    var pnt2 = controlPoints[1];
    var pnt3 = controlPoints[2];
    var pnts = olPlot.PlotUtils.getBisectorNormals(0, pnt1, pnt2, pnt3);
    var normalRight = pnts[0];
    var normal = olPlot.PlotUtils.getNormal(pnt1, pnt2, pnt3);
    var dist = Math.sqrt(normal[0]*normal[0] + normal[1]*normal[1]);
    if(dist > olPlot.Constants.ZERO_TOLERANCE){
        var mid = olPlot.PlotUtils.mid(pnt1, pnt2);
        var pX = pnt1[0] - mid[0];
        var pY = pnt1[1] - mid[1];

        var d1 = olPlot.PlotUtils.distance(pnt1, pnt2);
        // normal at midpoint
        var n  = 2.0/d1;
        var nX = -n*pY;
        var nY = n*pX;

        // upper triangle of symmetric transform matrix
        var a11 = nX*nX - nY*nY
        var a12 = 2*nX*nY;
        var a22 = nY*nY - nX*nX;

        var dX = normalRight[0] - mid[0];
        var dY = normalRight[1] - mid[1];

        // coordinates of reflected vector
        var controlX = mid[0] + a11*dX + a12*dY;
        var controlY = mid[1] + a12*dX + a22*dY;
    }
    else{
        controlX = pnt1[0] + t*(pnt2[0] - pnt1[0]);
        controlY = pnt1[1] + t*(pnt2[1] - pnt1[1]);
    }
    return [controlX, controlY];
};

olPlot.PlotUtils.getRightMostControlPoint = function(controlPoints){
    var count = controlPoints.length;
    var pnt1 = controlPoints[count-3];
    var pnt2 = controlPoints[count-2];
    var pnt3 = controlPoints[count-1];
    var pnts = olPlot.PlotUtils.getBisectorNormals(0, pnt1, pnt2, pnt3);
    var normalLeft = pnts[1];
    var normal = olPlot.PlotUtils.getNormal(pnt1, pnt2, pnt3);
    var dist = Math.sqrt(normal[0]*normal[0] + normal[1]*normal[1]);
    if(dist > olPlot.Constants.ZERO_TOLERANCE){
        var mid = olPlot.PlotUtils.mid(pnt2, pnt3);
        var pX = pnt3[0] - mid[0];
        var pY = pnt3[1] - mid[1];

        var d1 = olPlot.PlotUtils.distance(pnt2, pnt3);
        // normal at midpoint
        var n  = 2.0/d1;
        var nX = -n*pY;
        var nY = n*pX;

        // upper triangle of symmetric transform matrix
        var a11 = nX*nX - nY*nY
        var a12 = 2*nX*nY;
        var a22 = nY*nY - nX*nX;

        var dX = normalLeft[0] - mid[0];
        var dY = normalLeft[1] - mid[1];

        // coordinates of reflected vector
        var controlX = mid[0] + a11*dX + a12*dY;
        var controlY = mid[1] + a12*dX + a22*dY;
    }
    else{
        controlX = pnt3[0] + t*(pnt2[0] - pnt3[0]);
        controlY = pnt3[1] + t*(pnt2[1] - pnt3[1]);
    }
    return [controlX, controlY];
};

olPlot.PlotUtils.getBezierPoints = function(points){
    if (points.length <= 2)
        return points;

    var bezierPoints=[];
    var n=points.length - 1;
    for (var t=0; t <= 1; t+=0.01){
        var x=y=0;
        for (var index=0; index <= n; index++){
            var factor=olPlot.PlotUtils.getBinomialFactor(n, index);
            var a=Math.pow(t, index);
            var b=Math.pow((1 - t), (n - index));
            x+=factor * a * b * points[index][0];
            y+=factor * a * b * points[index][1];
        }
        bezierPoints.push([x, y]);
    }
    bezierPoints.push(points[n]);
    return bezierPoints;
};

olPlot.PlotUtils.getBinomialFactor = function(n, index){
    return olPlot.PlotUtils.getFactorial(n) / (olPlot.PlotUtils.getFactorial(index) * olPlot.PlotUtils.getFactorial(n - index));
};

olPlot.PlotUtils.getFactorial = function(n){
    if (n <= 1)
        return 1;
    if (n == 2)
        return 2;
    if (n == 3)
        return 6;
    if (n == 4)
        return 24;
    if (n == 5)
        return 120;
    var result=1;
    for (var i=1; i <= n; i++)
        result*=i;
    return result;
};

olPlot.PlotUtils.getQBSplinePoints = function(points){
    if (points.length <= 2 )
        return points;

    var n = 2;

    var bSplinePoints=[];
    var m=points.length - n - 1;
    bSplinePoints.push(points[0]);
    for (var i=0; i <= m; i++){
        for (var t=0; t <= 1; t+=0.05){
            var x=y=0;
            for (var k=0; k <= n; k++){
                var factor=olPlot.PlotUtils.getQuadricBSplineFactor(k, t);
                x+=factor * points[i + k][0];
                y+=factor * points[i + k][1];
            }
            bSplinePoints.push([x, y]);
        }
    }
    bSplinePoints.push(points[points.length - 1]);
    return bSplinePoints;
};

olPlot.PlotUtils.getQuadricBSplineFactor = function(k, t){
    if (k == 0)
        return Math.pow(t - 1, 2) / 2;
    if (k == 1)
        return (-2 * Math.pow(t, 2) + 2 * t + 1) / 2;
    if (k == 2)
        return Math.pow(t, 2) / 2;
    return 0;
};
olPlot.Plot = function (points) {
  this.setPoints(points);
};

olPlot.Plot.prototype = {

  isPlot: function () {
    return true;
  },

  setPoints: function (value) {
    this.points = value ? value : [];
    if (this.points.length >= 1)
      this.generate();
  },

  getPoints: function () {
    return this.points.slice(0);
  },

  getPointCount: function () {
    return this.points.length;
  },

  updatePoint: function (point, index) {
    if (index >= 0 && index < this.points.length) {
      this.points[index] = point;
      this.generate();
    }
  },

  updateLastPoint: function (point) {
    this.updatePoint(point, this.points.length - 1);
  },

  generate: function () {
  },

  finishDrawing: function () {

  }

};


olPlot.Plot.Marker = function (points) {
  olPlot.Utils.base(this, [0, 0]);
  this.type = olPlot.PlotTypes.MARKER;
  this.fixPointCount = 1;
  this.setPoints(points);
}
olPlot.Utils.inherits(olPlot.Plot.Marker, ol.geom.Point);
olPlot.Utils.mixin(olPlot.Plot.Marker.prototype, olPlot.Plot.prototype);
olPlot.Plot.Marker.prototype.generate = function () {
  var pnt = this.points[0];
  this.setCoordinates(pnt);
};


olPlot.Plot.Arc = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.ARC;
  this.fixPointCount = 3;
  this.setPoints(points);
};
olPlot.Utils.inherits(olPlot.Plot.Arc, ol.geom.LineString);
olPlot.Utils.mixin(olPlot.Plot.Arc.prototype, olPlot.Plot.prototype);

olPlot.Plot.Arc.prototype.generate = function () {
  var count = this.getPointCount();
  if (count < 2) {
    return;
  }
  if (count == 2) {
    this.setCoordinates(this.points);
  } else {
    var pnt1 = this.points[0];
    var pnt2 = this.points[1];
    var pnt3 = this.points[2];
    var center = olPlot.PlotUtils.getCircleCenterOfThreePoints(pnt1, pnt2, pnt3);
    var radius = olPlot.PlotUtils.distance(pnt1, center);

    var angle1 = olPlot.PlotUtils.getAzimuth(pnt1, center);
    var angle2 = olPlot.PlotUtils.getAzimuth(pnt2, center);
    if (olPlot.PlotUtils.isClockWise(pnt1, pnt2, pnt3)) {
      var startAngle = angle2;
      var endAngle = angle1;
    }
    else {
      startAngle = angle1;
      endAngle = angle2;
    }
    this.setCoordinates(olPlot.PlotUtils.getArcPoints(center, radius, startAngle, endAngle));
  }
};
olPlot.Plot.AttackArrow = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.ATTACK_ARROW;
  this.headHeightFactor = 0.18;
  this.headWidthFactor = 0.3;
  this.neckHeightFactor = 0.85;
  this.neckWidthFactor = 0.15;
  this.headTailFactor = 0.8;
  this.setPoints(points);
};

olPlot.Utils.inherits(olPlot.Plot.AttackArrow, ol.geom.Polygon);
olPlot.Utils.mixin(olPlot.Plot.AttackArrow.prototype, olPlot.Plot.prototype);

olPlot.Plot.AttackArrow.prototype.generate = function () {
  if (this.getPointCount() < 2) {
    return;
  }
  if (this.getPointCount() == 2) {
    this.setCoordinates([this.points]);
    return;
  }
  var pnts = this.getPoints();
  // 计算箭尾
  var tailLeft = pnts[0];
  var tailRight = pnts[1];
  if (olPlot.PlotUtils.isClockWise(pnts[0], pnts[1], pnts[2])) {
    tailLeft = pnts[1];
    tailRight = pnts[0];
  }
  var midTail = olPlot.PlotUtils.mid(tailLeft, tailRight);
  var bonePnts = [midTail].concat(pnts.slice(2));
  // 计算箭头
  var headPnts = this.getArrowHeadPoints(bonePnts, tailLeft, tailRight);
  var neckLeft = headPnts[0];
  var neckRight = headPnts[4];
  var tailWidthFactor = olPlot.PlotUtils.distance(tailLeft, tailRight) / olPlot.PlotUtils.getBaseLength(bonePnts);
  // 计算箭身
  var bodyPnts = this.getArrowBodyPoints(bonePnts, neckLeft, neckRight, tailWidthFactor);
  // 整合
  var count = bodyPnts.length;
  var leftPnts = [tailLeft].concat(bodyPnts.slice(0, count / 2));
  leftPnts.push(neckLeft);
  var rightPnts = [tailRight].concat(bodyPnts.slice(count / 2, count));
  rightPnts.push(neckRight);

  leftPnts = olPlot.PlotUtils.getQBSplinePoints(leftPnts);
  rightPnts = olPlot.PlotUtils.getQBSplinePoints(rightPnts);

  this.setCoordinates([leftPnts.concat(headPnts, rightPnts.reverse())]);
};

olPlot.Plot.AttackArrow.prototype.getArrowHeadPoints = function (points, tailLeft, tailRight) {
  var len = olPlot.PlotUtils.getBaseLength(points);
  var headHeight = len * this.headHeightFactor;
  var headPnt = points[points.length - 1];
  len = olPlot.PlotUtils.distance(headPnt, points[points.length - 2]);
  var tailWidth = olPlot.PlotUtils.distance(tailLeft, tailRight);
  if (headHeight > tailWidth * this.headTailFactor) {
    headHeight = tailWidth * this.headTailFactor;
  }
  var headWidth = headHeight * this.headWidthFactor;
  var neckWidth = headHeight * this.neckWidthFactor;
  headHeight = headHeight > len ? len : headHeight;
  var neckHeight = headHeight * this.neckHeightFactor;
  var headEndPnt = olPlot.PlotUtils.getThirdPoint(points[points.length - 2], headPnt, 0, headHeight, true);
  var neckEndPnt = olPlot.PlotUtils.getThirdPoint(points[points.length - 2], headPnt, 0, neckHeight, true);
  var headLeft = olPlot.PlotUtils.getThirdPoint(headPnt, headEndPnt, olPlot.Constants.HALF_PI, headWidth, false);
  var headRight = olPlot.PlotUtils.getThirdPoint(headPnt, headEndPnt, olPlot.Constants.HALF_PI, headWidth, true);
  var neckLeft = olPlot.PlotUtils.getThirdPoint(headPnt, neckEndPnt, olPlot.Constants.HALF_PI, neckWidth, false);
  var neckRight = olPlot.PlotUtils.getThirdPoint(headPnt, neckEndPnt, olPlot.Constants.HALF_PI, neckWidth, true);
  return [neckLeft, headLeft, headPnt, headRight, neckRight];
};

olPlot.Plot.AttackArrow.prototype.getArrowBodyPoints = function (points, neckLeft, neckRight, tailWidthFactor) {
  var allLen = olPlot.PlotUtils.wholeDistance(points);
  var len = olPlot.PlotUtils.getBaseLength(points);
  var tailWidth = len * tailWidthFactor;
  var neckWidth = olPlot.PlotUtils.distance(neckLeft, neckRight);
  var widthDif = (tailWidth - neckWidth) / 2;
  var tempLen = 0, leftBodyPnts = [], rightBodyPnts = [];
  for (var i = 1; i < points.length - 1; i++) {
    var angle = olPlot.PlotUtils.getAngleOfThreePoints(points[i - 1], points[i], points[i + 1]) / 2;
    tempLen += olPlot.PlotUtils.distance(points[i - 1], points[i]);
    var w = (tailWidth / 2 - tempLen / allLen * widthDif) / Math.sin(angle);
    var left = olPlot.PlotUtils.getThirdPoint(points[i - 1], points[i], Math.PI - angle, w, true);
    var right = olPlot.PlotUtils.getThirdPoint(points[i - 1], points[i], angle, w, false);
    leftBodyPnts.push(left);
    rightBodyPnts.push(right);
  }
  return leftBodyPnts.concat(rightBodyPnts);
};
olPlot.Plot.SquadCombat = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.SQUAD_COMBAT;
  this.headHeightFactor = 0.18;
  this.headWidthFactor = 0.3;
  this.neckHeightFactor = 0.85;
  this.neckWidthFactor = 0.15;
  this.tailWidthFactor = 0.1;
  this.setPoints(points);
};

olPlot.Utils.inherits(olPlot.Plot.SquadCombat, olPlot.Plot.AttackArrow);

olPlot.Plot.SquadCombat.prototype.generate = function () {
  var count = this.getPointCount();
  if (count < 2) {
    return;
  }
  var pnts = this.getPoints();
  var tailPnts = this.getTailPoints(pnts);
  var headPnts = this.getArrowHeadPoints(pnts, tailPnts[0], tailPnts[1]);
  var neckLeft = headPnts[0];
  var neckRight = headPnts[4];
  var bodyPnts = this.getArrowBodyPoints(pnts, neckLeft, neckRight, this.tailWidthFactor);
  var count = bodyPnts.length;
  var leftPnts = [tailPnts[0]].concat(bodyPnts.slice(0, count / 2));
  leftPnts.push(neckLeft);
  var rightPnts = [tailPnts[1]].concat(bodyPnts.slice(count / 2, count));
  rightPnts.push(neckRight);

  leftPnts = olPlot.PlotUtils.getQBSplinePoints(leftPnts);
  rightPnts = olPlot.PlotUtils.getQBSplinePoints(rightPnts);

  this.setCoordinates([leftPnts.concat(headPnts, rightPnts.reverse())]);
};

olPlot.Plot.SquadCombat.prototype.getTailPoints = function (points) {
  var allLen = olPlot.PlotUtils.getBaseLength(points);
  var tailWidth = allLen * this.tailWidthFactor;
  var tailLeft = olPlot.PlotUtils.getThirdPoint(points[1], points[0], olPlot.Constants.HALF_PI, tailWidth, false);
  var tailRight = olPlot.PlotUtils.getThirdPoint(points[1], points[0], olPlot.Constants.HALF_PI, tailWidth, true);
  return [tailLeft, tailRight];
};
olPlot.Plot.TailedAttackArrow = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.TAILED_ATTACK_ARROW;
  this.headHeightFactor = 0.18;
  this.headWidthFactor = 0.3;
  this.neckHeightFactor = 0.85;
  this.neckWidthFactor = 0.15;
  this.tailWidthFactor = 0.1;
  this.headTailFactor = 0.8;
  this.swallowTailFactor = 1;
  this.swallowTailPnt = null;
  this.setPoints(points);
};

olPlot.Utils.inherits(olPlot.Plot.TailedAttackArrow, olPlot.Plot.AttackArrow);

olPlot.Plot.TailedAttackArrow.prototype.generate = function () {
  var count = this.getPointCount();
  if (count < 2) {
    return;
  }
  if (this.getPointCount() == 2) {
    this.setCoordinates([this.points]);
    return;
  }
  var pnts = this.getPoints();
  var tailLeft = pnts[0];
  var tailRight = pnts[1];
  if (olPlot.PlotUtils.isClockWise(pnts[0], pnts[1], pnts[2])) {
    tailLeft = pnts[1];
    tailRight = pnts[0];
  }
  var midTail = olPlot.PlotUtils.mid(tailLeft, tailRight);
  var bonePnts = [midTail].concat(pnts.slice(2));
  var headPnts = this.getArrowHeadPoints(bonePnts, tailLeft, tailRight);
  var neckLeft = headPnts[0];
  var neckRight = headPnts[4];
  var tailWidth = olPlot.PlotUtils.distance(tailLeft, tailRight);
  var allLen = olPlot.PlotUtils.getBaseLength(bonePnts);
  var len = allLen * this.tailWidthFactor * this.swallowTailFactor;
  this.swallowTailPnt = olPlot.PlotUtils.getThirdPoint(bonePnts[1], bonePnts[0], 0, len, true);
  var factor = tailWidth / allLen;
  var bodyPnts = this.getArrowBodyPoints(bonePnts, neckLeft, neckRight, factor);
  var count = bodyPnts.length;
  var leftPnts = [tailLeft].concat(bodyPnts.slice(0, count / 2));
  leftPnts.push(neckLeft);
  var rightPnts = [tailRight].concat(bodyPnts.slice(count / 2, count));
  rightPnts.push(neckRight);

  leftPnts = olPlot.PlotUtils.getQBSplinePoints(leftPnts);
  rightPnts = olPlot.PlotUtils.getQBSplinePoints(rightPnts);

  this.setCoordinates([leftPnts.concat(headPnts, rightPnts.reverse(), [this.swallowTailPnt, leftPnts[0]])]);
};
olPlot.Plot.TailedSquadCombat = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.TAILED_SQUAD_COMBAT;
  this.headHeightFactor = 0.18;
  this.headWidthFactor = 0.3;
  this.neckHeightFactor = 0.85;
  this.neckWidthFactor = 0.15;
  this.tailWidthFactor = 0.1;
  this.swallowTailFactor = 1;
  this.swallowTailPnt = null;
  this.setPoints(points);
};

olPlot.Utils.inherits(olPlot.Plot.TailedSquadCombat, olPlot.Plot.AttackArrow);

olPlot.Plot.TailedSquadCombat.prototype.generate = function () {
  var count = this.getPointCount();
  if (count < 2) {
    return;
  }
  var pnts = this.getPoints();
  var tailPnts = this.getTailPoints(pnts);
  var headPnts = this.getArrowHeadPoints(pnts, tailPnts[0], tailPnts[2]);
  var neckLeft = headPnts[0];
  var neckRight = headPnts[4];
  var bodyPnts = this.getArrowBodyPoints(pnts, neckLeft, neckRight, this.tailWidthFactor);
  var count = bodyPnts.length;
  var leftPnts = [tailPnts[0]].concat(bodyPnts.slice(0, count / 2));
  leftPnts.push(neckLeft);
  var rightPnts = [tailPnts[2]].concat(bodyPnts.slice(count / 2, count));
  rightPnts.push(neckRight);

  leftPnts = olPlot.PlotUtils.getQBSplinePoints(leftPnts);
  rightPnts = olPlot.PlotUtils.getQBSplinePoints(rightPnts);

  this.setCoordinates([leftPnts.concat(headPnts, rightPnts.reverse(), [tailPnts[1], leftPnts[0]])]);
};

olPlot.Plot.TailedSquadCombat.prototype.getTailPoints = function (points) {
  var allLen = olPlot.PlotUtils.getBaseLength(points);
  var tailWidth = allLen * this.tailWidthFactor;
  var tailLeft = olPlot.PlotUtils.getThirdPoint(points[1], points[0], olPlot.Constants.HALF_PI, tailWidth, false);
  var tailRight = olPlot.PlotUtils.getThirdPoint(points[1], points[0], olPlot.Constants.HALF_PI, tailWidth, true);
  var len = tailWidth * this.swallowTailFactor;
  var swallowTailPnt = olPlot.PlotUtils.getThirdPoint(points[1], points[0], 0, len, true);
  return [tailLeft, swallowTailPnt, tailRight];
};
olPlot.Plot.Circle = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.CIRCLE;
  this.fixPointCount = 2;
  this.setPoints(points);
}
olPlot.Utils.inherits(olPlot.Plot.Circle, ol.geom.Polygon);
olPlot.Utils.mixin(olPlot.Plot.Circle.prototype, olPlot.Plot.prototype);
olPlot.Plot.Circle.prototype.generate = function () {
  var count = this.getPointCount();
  if (count < 2) {
    return;
  }
  var center = this.points[0];
  var radius = olPlot.PlotUtils.distance(center, this.points[1]);
  this.setCoordinates([this.generatePoints(center, radius)]);
};
olPlot.Plot.Circle.prototype.generatePoints = function (center, radius) {
  var x, y, angle, points = [];
  for (var i = 0; i <= olPlot.Constants.FITTING_COUNT; i++) {
    angle = Math.PI * 2 * i / olPlot.Constants.FITTING_COUNT;
    x = center[0] + radius * Math.cos(angle);
    y = center[1] + radius * Math.sin(angle);
    points.push([x, y]);
  }
  return points;
};

olPlot.Plot.ClosedCurve = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.CLOSED_CURVE;
  this.t = 0.3;
  this.setPoints(points);
};
olPlot.Utils.inherits(olPlot.Plot.ClosedCurve, ol.geom.Polygon);
olPlot.Utils.mixin(olPlot.Plot.ClosedCurve.prototype, olPlot.Plot.prototype);
olPlot.Plot.ClosedCurve.prototype.generate = function () {
  var count = this.getPointCount();
  if (count < 2) {
    return;
  }
  if (count == 2) {
    this.setCoordinates([this.points]);
  }
  else {
    var pnts = this.getPoints();
    pnts.push(pnts[0], pnts[1]);
    var normals = [];
    for (var i = 0; i < pnts.length - 2; i++) {
      var normalPoints = olPlot.PlotUtils.getBisectorNormals(this.t, pnts[i], pnts[i + 1], pnts[i + 2]);
      normals = normals.concat(normalPoints);
    }
    var count = normals.length;
    normals = [normals[count - 1]].concat(normals.slice(0, count - 1));

    var pList = [];
    for (i = 0; i < pnts.length - 2; i++) {
      var pnt1 = pnts[i];
      var pnt2 = pnts[i + 1];
      pList.push(pnt1);
      for (var t = 0; t <= olPlot.Constants.FITTING_COUNT; t++) {
        var pnt = olPlot.PlotUtils.getCubicValue(t / olPlot.Constants.FITTING_COUNT, pnt1, normals[i * 2], normals[i * 2 + 1], pnt2);
        pList.push(pnt);
      }
      pList.push(pnt2);
    }
    this.setCoordinates([pList]);
  }
};
olPlot.Plot.Curve = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.CURVE;
  this.t = 0.3;
  this.setPoints(points);
};
olPlot.Utils.inherits(olPlot.Plot.Curve, ol.geom.LineString);
olPlot.Utils.mixin(olPlot.Plot.Curve.prototype, olPlot.Plot.prototype);
olPlot.Plot.Curve.prototype.generate = function () {
  var count = this.getPointCount();
  if (count < 2) {
    return;
  }
  if (count == 2) {
    this.setCoordinates(this.points);
  } else {
    this.setCoordinates(olPlot.PlotUtils.getCurvePoints(this.t, this.points));
  }
};
olPlot.Plot.DoubleArrow = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.DOUBLE_ARROW;
  this.headHeightFactor = 0.25;
  this.headWidthFactor = 0.3;
  this.neckHeightFactor = 0.85;
  this.neckWidthFactor = 0.15;
  this.connPoint = null;
  this.tempPoint4 = null;
  this.fixPointCount = 4;
  this.setPoints(points);
};
olPlot.Utils.inherits(olPlot.Plot.DoubleArrow, ol.geom.Polygon);
olPlot.Utils.mixin(olPlot.Plot.DoubleArrow.prototype, olPlot.Plot.prototype);
olPlot.Plot.DoubleArrow.prototype.finishDrawing = function () {
  if (this.getPointCount() == 3 && this.tempPoint4 != null)
    this.points.push(this.tempPoint4);
  if (this.connPoint != null)
    this.points.push(this.connPoint);
};

olPlot.Plot.DoubleArrow.prototype.generate = function () {
  var count = this.getPointCount();
  if (count < 2) {
    return;
  }
  if (count == 2) {
    this.setCoordinates([this.points]);
    return;
  }
  var pnt1 = this.points[0];
  var pnt2 = this.points[1];
  var pnt3 = this.points[2];
  var count = this.getPointCount();
  if (count == 3)
    this.tempPoint4 = this.getTempPoint4(pnt1, pnt2, pnt3);
  else
    this.tempPoint4 = this.points[3];
  if (count == 3 || count == 4)
    this.connPoint = olPlot.PlotUtils.mid(pnt1, pnt2);
  else
    this.connPoint = this.points[4];
  var leftArrowPnts, rightArrowPnts;
  if (olPlot.PlotUtils.isClockWise(pnt1, pnt2, pnt3)) {
    leftArrowPnts = this.getArrowPoints(pnt1, this.connPoint, this.tempPoint4, false);
    rightArrowPnts = this.getArrowPoints(this.connPoint, pnt2, pnt3, true);
  } else {
    leftArrowPnts = this.getArrowPoints(pnt2, this.connPoint, pnt3, false);
    rightArrowPnts = this.getArrowPoints(this.connPoint, pnt1, this.tempPoint4, true);
  }
  var m = leftArrowPnts.length;
  var t = (m - 5) / 2;

  var llBodyPnts = leftArrowPnts.slice(0, t);
  var lArrowPnts = leftArrowPnts.slice(t, t + 5);
  var lrBodyPnts = leftArrowPnts.slice(t + 5, m);

  var rlBodyPnts = rightArrowPnts.slice(0, t);
  var rArrowPnts = rightArrowPnts.slice(t, t + 5);
  var rrBodyPnts = rightArrowPnts.slice(t + 5, m);

  rlBodyPnts = olPlot.PlotUtils.getBezierPoints(rlBodyPnts);
  var bodyPnts = olPlot.PlotUtils.getBezierPoints(rrBodyPnts.concat(llBodyPnts.slice(1)));
  lrBodyPnts = olPlot.PlotUtils.getBezierPoints(lrBodyPnts);

  var pnts = rlBodyPnts.concat(rArrowPnts, bodyPnts, lArrowPnts, lrBodyPnts);
  this.setCoordinates([pnts]);
};

olPlot.Plot.DoubleArrow.prototype.getArrowPoints = function (pnt1, pnt2, pnt3, clockWise) {
  var midPnt = olPlot.PlotUtils.mid(pnt1, pnt2);
  var len = olPlot.PlotUtils.distance(midPnt, pnt3);
  var midPnt1 = olPlot.PlotUtils.getThirdPoint(pnt3, midPnt, 0, len * 0.3, true);
  var midPnt2 = olPlot.PlotUtils.getThirdPoint(pnt3, midPnt, 0, len * 0.5, true);
  //var midPnt3=PlotUtils.getThirdPoint(pnt3, midPnt, 0, len * 0.7, true);
  midPnt1 = olPlot.PlotUtils.getThirdPoint(midPnt, midPnt1, olPlot.Constants.HALF_PI, len / 5, clockWise);
  midPnt2 = olPlot.PlotUtils.getThirdPoint(midPnt, midPnt2, olPlot.Constants.HALF_PI, len / 4, clockWise);
  //midPnt3=PlotUtils.getThirdPoint(midPnt, midPnt3, Constants.HALF_PI, len / 5, clockWise);

  var points = [midPnt, midPnt1, midPnt2, pnt3];
  // 计算箭头部分
  var arrowPnts = this.getArrowHeadPoints(points, this.headHeightFactor, this.headWidthFactor, this.neckHeightFactor, this.neckWidthFactor);
  var neckLeftPoint = arrowPnts[0];
  var neckRightPoint = arrowPnts[4];
  // 计算箭身部分
  var tailWidthFactor = olPlot.PlotUtils.distance(pnt1, pnt2) / olPlot.PlotUtils.getBaseLength(points) / 2;
  var bodyPnts = this.getArrowBodyPoints(points, neckLeftPoint, neckRightPoint, tailWidthFactor);
  var n = bodyPnts.length;
  var lPoints = bodyPnts.slice(0, n / 2);
  var rPoints = bodyPnts.slice(n / 2, n);
  lPoints.push(neckLeftPoint);
  rPoints.push(neckRightPoint);
  lPoints = lPoints.reverse();
  lPoints.push(pnt2);
  rPoints = rPoints.reverse();
  rPoints.push(pnt1);
  return lPoints.reverse().concat(arrowPnts, rPoints);
};

olPlot.Plot.DoubleArrow.prototype.getArrowHeadPoints = function (points, tailLeft, tailRight) {
  var len = olPlot.PlotUtils.getBaseLength(points);
  var headHeight = len * this.headHeightFactor;
  var headPnt = points[points.length - 1];
  var tailWidth = olPlot.PlotUtils.distance(tailLeft, tailRight);
  var headWidth = headHeight * this.headWidthFactor;
  var neckWidth = headHeight * this.neckWidthFactor;
  var neckHeight = headHeight * this.neckHeightFactor;
  var headEndPnt = olPlot.PlotUtils.getThirdPoint(points[points.length - 2], headPnt, 0, headHeight, true);
  var neckEndPnt = olPlot.PlotUtils.getThirdPoint(points[points.length - 2], headPnt, 0, neckHeight, true);
  var headLeft = olPlot.PlotUtils.getThirdPoint(headPnt, headEndPnt, olPlot.Constants.HALF_PI, headWidth, false);
  var headRight = olPlot.PlotUtils.getThirdPoint(headPnt, headEndPnt, olPlot.Constants.HALF_PI, headWidth, true);
  var neckLeft = olPlot.PlotUtils.getThirdPoint(headPnt, neckEndPnt, olPlot.Constants.HALF_PI, neckWidth, false);
  var neckRight = olPlot.PlotUtils.getThirdPoint(headPnt, neckEndPnt, olPlot.Constants.HALF_PI, neckWidth, true);
  return [neckLeft, headLeft, headPnt, headRight, neckRight];
};

olPlot.Plot.DoubleArrow.prototype.getArrowBodyPoints = function (points, neckLeft, neckRight, tailWidthFactor) {
  var allLen = olPlot.PlotUtils.wholeDistance(points);
  var len = olPlot.PlotUtils.getBaseLength(points);
  var tailWidth = len * tailWidthFactor;
  var neckWidth = olPlot.PlotUtils.distance(neckLeft, neckRight);
  var widthDif = (tailWidth - neckWidth) / 2;
  var tempLen = 0, leftBodyPnts = [], rightBodyPnts = [];
  for (var i = 1; i < points.length - 1; i++) {
    var angle = olPlot.PlotUtils.getAngleOfThreePoints(points[i - 1], points[i], points[i + 1]) / 2;
    tempLen += olPlot.PlotUtils.distance(points[i - 1], points[i]);
    var w = (tailWidth / 2 - tempLen / allLen * widthDif) / Math.sin(angle);
    var left = olPlot.PlotUtils.getThirdPoint(points[i - 1], points[i], Math.PI - angle, w, true);
    var right = olPlot.PlotUtils.getThirdPoint(points[i - 1], points[i], angle, w, false);
    leftBodyPnts.push(left);
    rightBodyPnts.push(right);
  }
  return leftBodyPnts.concat(rightBodyPnts);
};

// 计算对称点
olPlot.Plot.DoubleArrow.prototype.getTempPoint4 = function (linePnt1, linePnt2, point) {
  var midPnt = olPlot.PlotUtils.mid(linePnt1, linePnt2);
  var len = olPlot.PlotUtils.distance(midPnt, point);
  var angle = olPlot.PlotUtils.getAngleOfThreePoints(linePnt1, midPnt, point);
  var symPnt, distance1, distance2, mid;
  if (angle < olPlot.Constants.HALF_PI) {
    distance1 = len * Math.sin(angle);
    distance2 = len * Math.cos(angle);
    mid = olPlot.PlotUtils.getThirdPoint(linePnt1, midPnt, olPlot.Constants.HALF_PI, distance1, false);
    symPnt = olPlot.PlotUtils.getThirdPoint(midPnt, mid, olPlot.Constants.HALF_PI, distance2, true);
  }
  else if (angle >= olPlot.Constants.HALF_PI && angle < Math.PI) {
    distance1 = len * Math.sin(Math.PI - angle);
    distance2 = len * Math.cos(Math.PI - angle);
    mid = olPlot.PlotUtils.getThirdPoint(linePnt1, midPnt, olPlot.Constants.HALF_PI, distance1, false);
    symPnt = olPlot.PlotUtils.getThirdPoint(midPnt, mid, olPlot.Constants.HALF_PI, distance2, false);
  }
  else if (angle >= Math.PI && angle < Math.PI * 1.5) {
    distance1 = len * Math.sin(angle - Math.PI);
    distance2 = len * Math.cos(angle - Math.PI);
    mid = olPlot.PlotUtils.getThirdPoint(linePnt1, midPnt, olPlot.Constants.HALF_PI, distance1, true);
    symPnt = olPlot.PlotUtils.getThirdPoint(midPnt, mid, olPlot.Constants.HALF_PI, distance2, true);
  }
  else {
    distance1 = len * Math.sin(Math.PI * 2 - angle);
    distance2 = len * Math.cos(Math.PI * 2 - angle);
    mid = olPlot.PlotUtils.getThirdPoint(linePnt1, midPnt, olPlot.Constants.HALF_PI, distance1, true);
    symPnt = olPlot.PlotUtils.getThirdPoint(midPnt, mid, olPlot.Constants.HALF_PI, distance2, false);
  }
  return symPnt;
};

olPlot.Plot.Ellipse = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.ELLIPSE;
  this.fixPointCount = 2;
  this.setPoints(points);
};
olPlot.Utils.inherits(olPlot.Plot.Ellipse, ol.geom.Polygon);
olPlot.Utils.mixin(olPlot.Plot.Ellipse.prototype, olPlot.Plot.prototype);
olPlot.Plot.Ellipse.prototype.generate = function () {
  var count = this.getPointCount();
  if (count < 2) {
    return;
  }
  var pnt1 = this.points[0];
  var pnt2 = this.points[1];
  var center = olPlot.PlotUtils.mid(pnt1, pnt2);
  var majorRadius = Math.abs((pnt1[0] - pnt2[0]) / 2);
  var minorRadius = Math.abs((pnt1[1] - pnt2[1]) / 2);
  this.setCoordinates([this.generatePoints(center, majorRadius, minorRadius)]);
};

olPlot.Plot.Ellipse.prototype.generatePoints = function (center, majorRadius, minorRadius) {
  var x, y, angle, points = [];
  for (var i = 0; i <= olPlot.Constants.FITTING_COUNT; i++) {
    angle = Math.PI * 2 * i / olPlot.Constants.FITTING_COUNT;
    x = center[0] + majorRadius * Math.cos(angle);
    y = center[1] + minorRadius * Math.sin(angle);
    points.push([x, y]);
  }
  return points;
};


olPlot.Plot.FineArrow = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.FINE_ARROW;
  this.tailWidthFactor = 0.15;
  this.neckWidthFactor = 0.2;
  this.headWidthFactor = 0.25;
  this.headAngle = Math.PI / 8.5;
  this.neckAngle = Math.PI / 13;
  this.fixPointCount = 2;
  this.setPoints(points);
}
olPlot.Utils.inherits(olPlot.Plot.FineArrow, ol.geom.Polygon);
olPlot.Utils.mixin(olPlot.Plot.FineArrow.prototype, olPlot.Plot.prototype);
olPlot.Plot.FineArrow.prototype.generate = function () {
  var count = this.getPointCount();
  if (count < 2) {
    return;
  }
  var pnts = this.getPoints();
  var pnt1 = pnts[0];
  var pnt2 = pnts[1];
  var len = olPlot.PlotUtils.getBaseLength(pnts);
  var tailWidth = len * this.tailWidthFactor;
  var neckWidth = len * this.neckWidthFactor;
  var headWidth = len * this.headWidthFactor;
  var tailLeft = olPlot.PlotUtils.getThirdPoint(pnt2, pnt1, olPlot.Constants.HALF_PI, tailWidth, true);
  var tailRight = olPlot.PlotUtils.getThirdPoint(pnt2, pnt1, olPlot.Constants.HALF_PI, tailWidth, false);
  var headLeft = olPlot.PlotUtils.getThirdPoint(pnt1, pnt2, this.headAngle, headWidth, false);
  var headRight = olPlot.PlotUtils.getThirdPoint(pnt1, pnt2, this.headAngle, headWidth, true);
  var neckLeft = olPlot.PlotUtils.getThirdPoint(pnt1, pnt2, this.neckAngle, neckWidth, false);
  var neckRight = olPlot.PlotUtils.getThirdPoint(pnt1, pnt2, this.neckAngle, neckWidth, true);
  var pList = [tailLeft, neckLeft, headLeft, pnt2, headRight, neckRight, tailRight];
  this.setCoordinates([pList]);
};
olPlot.Plot.AssaultDirection = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.ASSAULT_DIRECTION;
  this.tailWidthFactor = 0.2;
  this.neckWidthFactor = 0.25;
  this.headWidthFactor = 0.3;
  this.headAngle = Math.PI / 4;
  this.neckAngle = Math.PI * 0.17741;
  this.setPoints(points);
};
olPlot.Utils.inherits(olPlot.Plot.AssaultDirection, olPlot.Plot.FineArrow);
olPlot.Plot.GatheringPlace = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.GATHERING_PLACE;
  this.t = 0.4;
  this.fixPointCount = 3;
  this.setPoints(points);
}

olPlot.Utils.inherits(olPlot.Plot.GatheringPlace, ol.geom.Polygon);
olPlot.Utils.mixin(olPlot.Plot.GatheringPlace.prototype, olPlot.Plot.prototype);

olPlot.Plot.GatheringPlace.prototype.generate = function () {
  var pnts = this.getPoints();
  if (pnts.length < 2) {
    return;
  }
  if (this.getPointCount() == 2) {
    var mid = olPlot.PlotUtils.mid(pnts[0], pnts[1]);
    var d = olPlot.PlotUtils.distance(pnts[0], mid) / 0.9;
    var pnt = olPlot.PlotUtils.getThirdPoint(pnts[0], mid, olPlot.Constants.HALF_PI, d, true);
    pnts = [pnts[0], pnt, pnts[1]];
  }
  var mid = olPlot.PlotUtils.mid(pnts[0], pnts[2]);
  pnts.push(mid, pnts[0], pnts[1]);

  var normals = [];
  for (var i = 0; i < pnts.length - 2; i++) {
    var pnt1 = pnts[i];
    var pnt2 = pnts[i + 1];
    var pnt3 = pnts[i + 2];
    var normalPoints = olPlot.PlotUtils.getBisectorNormals(this.t, pnt1, pnt2, pnt3);
    normals = normals.concat(normalPoints);
  }
  var count = normals.length;
  normals = [normals[count - 1]].concat(normals.slice(0, count - 1));
  var pList = [];
  for (i = 0; i < pnts.length - 2; i++) {
    pnt1 = pnts[i];
    pnt2 = pnts[i + 1];
    pList.push(pnt1);
    for (var t = 0; t <= olPlot.Constants.FITTING_COUNT; t++) {
      var pnt = olPlot.PlotUtils.getCubicValue(t / olPlot.Constants.FITTING_COUNT, pnt1, normals[i * 2], normals[i * 2 + 1], pnt2);
      pList.push(pnt);
    }
    pList.push(pnt2);
  }
  this.setCoordinates([pList]);
};
olPlot.Plot.Lune = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.LUNE;
  this.fixPointCount = 3;
  this.setPoints(points);
};

olPlot.Utils.inherits(olPlot.Plot.Lune, ol.geom.Polygon);
olPlot.Utils.mixin(olPlot.Plot.Lune.prototype, olPlot.Plot.prototype);

olPlot.Plot.Lune.prototype.generate = function () {
  if (this.getPointCount() < 2) {
    return;
  }
  var pnts = this.getPoints();
  if (this.getPointCount() == 2) {
    var mid = olPlot.PlotUtils.mid(pnts[0], pnts[1]);
    var d = olPlot.PlotUtils.distance(pnts[0], mid);
    var pnt = olPlot.PlotUtils.getThirdPoint(pnts[0], mid, olPlot.Constants.HALF_PI, d);
    pnts.push(pnt);
  }
  var pnt1 = pnts[0];
  var pnt2 = pnts[1];
  var pnt3 = pnts[2];
  var center = olPlot.PlotUtils.getCircleCenterOfThreePoints(pnt1, pnt2, pnt3);
  var radius = olPlot.PlotUtils.distance(pnt1, center);

  var angle1 = olPlot.PlotUtils.getAzimuth(pnt1, center);
  var angle2 = olPlot.PlotUtils.getAzimuth(pnt2, center);
  if (olPlot.PlotUtils.isClockWise(pnt1, pnt2, pnt3)) {
    var startAngle = angle2;
    var endAngle = angle1;
  }
  else {
    startAngle = angle1;
    endAngle = angle2;
  }
  var pnts = olPlot.PlotUtils.getArcPoints(center, radius, startAngle, endAngle);
  pnts.push(pnts[0]);
  this.setCoordinates([pnts]);
};
olPlot.Plot.Sector = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.SECTOR;
  this.fixPointCount = 3;
  this.setPoints(points);
};
olPlot.Utils.inherits(olPlot.Plot.Sector, ol.geom.Polygon);
olPlot.Utils.mixin(olPlot.Plot.Sector.prototype, olPlot.Plot.prototype);
olPlot.Plot.Sector.prototype.generate = function () {
  if (this.getPointCount() < 2)
    return;
  if (this.getPointCount() == 2)
    this.setCoordinates([this.points]);
  else {
    var pnts = this.getPoints();
    var center = pnts[0];
    var pnt2 = pnts[1];
    var pnt3 = pnts[2];
    var radius = olPlot.PlotUtils.distance(pnt2, center);
    var startAngle = olPlot.PlotUtils.getAzimuth(pnt2, center);
    var endAngle = olPlot.PlotUtils.getAzimuth(pnt3, center);
    var pList = olPlot.PlotUtils.getArcPoints(center, radius, startAngle, endAngle);
    pList.push(center, pList[0]);
    this.setCoordinates([pList]);
  }
};
olPlot.Plot.StraightArrow = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.STRAIGHT_ARROW;
  this.fixPointCount = 2;
  this.maxArrowLength = 3000000;
  this.arrowLengthScale = 5;
  this.setPoints(points);
};
olPlot.Utils.inherits(olPlot.Plot.StraightArrow, ol.geom.LineString);
olPlot.Utils.mixin(olPlot.Plot.StraightArrow.prototype, olPlot.Plot.prototype);
olPlot.Plot.StraightArrow.prototype.generate = function () {
  if (this.getPointCount() < 2) {
    return;
  }
  var pnts = this.getPoints();
  var pnt1 = pnts[0];
  var pnt2 = pnts[1];
  var distance = olPlot.PlotUtils.distance(pnt1, pnt2);
  var len = distance / this.arrowLengthScale;
  len = len > this.maxArrowLength ? this.maxArrowLength : len;
  var leftPnt = olPlot.PlotUtils.getThirdPoint(pnt1, pnt2, Math.PI / 6, len, false);
  var rightPnt = olPlot.PlotUtils.getThirdPoint(pnt1, pnt2, Math.PI / 6, len, true);
  this.setCoordinates([pnt1, pnt2, leftPnt, pnt2, rightPnt]);
};
olPlot.Plot.Polyline = function(points){
  olPlot.Utils.base(this, []);
    this.type = olPlot.PlotTypes.POLYLINE;
    this.setPoints(points);
};
olPlot.Utils.inherits(olPlot.Plot.Polyline, ol.geom.LineString);
olPlot.Utils.mixin(olPlot.Plot.Polyline.prototype, olPlot.Plot.prototype);
olPlot.Plot.Polyline.prototype.generate = function(){
    var count = this.getPointCount();
    if(count < 2) {
        return;
    }
    this.setCoordinates(this.points);
};
olPlot.Plot.Rectangle = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.RECTANGLE;
  this.fixPointCount = 2;
  this.setPoints(points);
};
olPlot.Utils.inherits(olPlot.Plot.Rectangle, ol.geom.Polygon);
olPlot.Utils.mixin(olPlot.Plot.Rectangle.prototype, olPlot.Plot.prototype);
olPlot.Plot.Rectangle.prototype.generate = function () {
  var count = this.getPointCount();
  if (count < 2) {
    return;
  } else {
    var pnt1 = this.points[0];
    var pnt2 = this.points[1];
    var xmin = Math.min(pnt1[0], pnt2[0]);
    var xmax = Math.max(pnt1[0], pnt2[0]);
    var ymin = Math.min(pnt1[1], pnt2[1]);
    var ymax = Math.max(pnt1[1], pnt2[1]);
    var tl = [xmin, ymax];
    var tr = [xmax, ymax];
    var br = [xmax, ymin];
    var bl = [xmin, ymin];
    this.setCoordinates([[tl, tr, br, bl]]);
  }
};
olPlot.Plot.FreehandLine = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.FREEHAND_LINE;
  this.freehand = true;
  this.setPoints(points);
};
olPlot.Utils.inherits(olPlot.Plot.FreehandLine, ol.geom.LineString);
olPlot.Utils.mixin(olPlot.Plot.FreehandLine.prototype, olPlot.Plot.prototype);
olPlot.Plot.FreehandLine.prototype.generate = function () {
  var count = this.getPointCount();
  if (count < 2) {
    return;
  }
  this.setCoordinates(this.points);
};
olPlot.Plot.Polygon = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.POLYGON;
  this.setPoints(points);
};
olPlot.Utils.inherits(olPlot.Plot.Polygon, ol.geom.Polygon);
olPlot.Utils.mixin(olPlot.Plot.Polygon.prototype, olPlot.Plot.prototype);
olPlot.Plot.Polygon.prototype.generate = function () {
  var count = this.getPointCount();
  if (count < 2) {
    return;
  }
  this.setCoordinates([this.points]);
};
olPlot.Plot.FreehandPolygon = function (points) {
  olPlot.Utils.base(this, []);
  this.type = olPlot.PlotTypes.FREEHAND_POLYGON;
  this.freehand = true;
  this.setPoints(points);
};
olPlot.Utils.inherits(olPlot.Plot.FreehandPolygon, ol.geom.Polygon);
olPlot.Utils.mixin(olPlot.Plot.FreehandPolygon.prototype, olPlot.Plot.prototype);
olPlot.Plot.FreehandPolygon.prototype.generate = function () {
  var count = this.getPointCount();
  if (count < 2) {
    return;
  }
  this.setCoordinates([this.points]);
};
olPlot.PlotFactory = {};
olPlot.PlotFactory.createPlot = function (type, points) {
  switch (type) {
    case olPlot.PlotTypes.ARC:
      return new olPlot.Plot.Arc(points);
    case olPlot.PlotTypes.ELLIPSE:
      return new olPlot.Plot.Ellipse(points);
    case olPlot.PlotTypes.CURVE:
      return new olPlot.Plot.Curve(points);
    case olPlot.PlotTypes.CLOSED_CURVE:
      return new olPlot.Plot.ClosedCurve(points);
    case olPlot.PlotTypes.LUNE:
      return new olPlot.Plot.Lune(points);
    case olPlot.PlotTypes.SECTOR:
      return new olPlot.Plot.Sector(points);
    case olPlot.PlotTypes.GATHERING_PLACE:
      return new olPlot.Plot.GatheringPlace(points);
    case olPlot.PlotTypes.STRAIGHT_ARROW:
      return new olPlot.Plot.StraightArrow(points);
    case olPlot.PlotTypes.ASSAULT_DIRECTION:
      return new olPlot.Plot.AssaultDirection(points);
    case olPlot.PlotTypes.ATTACK_ARROW:
      return new olPlot.Plot.AttackArrow(points);
    case olPlot.PlotTypes.FINE_ARROW:
      return new olPlot.Plot.FineArrow(points);
    case olPlot.PlotTypes.CIRCLE:
      return new olPlot.Plot.Circle(points);
    case olPlot.PlotTypes.DOUBLE_ARROW:
      return new olPlot.Plot.DoubleArrow(points);
    case olPlot.PlotTypes.TAILED_ATTACK_ARROW:
      return new olPlot.Plot.TailedAttackArrow(points);
    case olPlot.PlotTypes.SQUAD_COMBAT:
      return new olPlot.Plot.SquadCombat(points);
    case olPlot.PlotTypes.TAILED_SQUAD_COMBAT:
      return new olPlot.Plot.TailedSquadCombat(points);
    case olPlot.PlotTypes.FREEHAND_LINE:
      return new olPlot.Plot.FreehandLine(points);
    case olPlot.PlotTypes.FREEHAND_POLYGON:
      return new olPlot.Plot.FreehandPolygon(points);
    case olPlot.PlotTypes.POLYGON:
      return new olPlot.Plot.Polygon(points);
    case olPlot.PlotTypes.MARKER:
      return new olPlot.Plot.Marker(points);
    case olPlot.PlotTypes.RECTANGLE:
      return new olPlot.Plot.Rectangle(points);
    case olPlot.PlotTypes.POLYLINE:
      return new olPlot.Plot.Polyline(points);
  }
  return null;
}
olPlot.PlotDraw = function (map) {
  this.points = null;
  this.plot = null;
  this.feature = null;
  this.plotType = null;
  this.plotParams = null;
  this.mapViewport = null;
  this.dblClickZoomInteraction = null;
  var stroke = new ol.style.Stroke({color: '#7DC826', width: 2});
  var fill = new ol.style.Fill({color: 'rgba(158, 255, 232, 0.8)'});
  var icon = new ol.style.Icon({
    anchor: [0.5, 1],
    anchorXUnits: 'fraction',
    anchorYUnits: 'fraction',
    opacity: 0.75,
    src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADQ0lEQVRYR8VXTVIaURD+evABi0BYWhVJdJEEVsETBE8gngA4QfAEkhMIJ9CcQDyB4wkkK0w2EjFVWSJkAfPgderNODplzb+LvO3MdH+vv6/76yH850MvyT/axHZ+genOFNO0cRIBuCmhtCyKJoAWQLVnScfEbJJC/8NvOYwLKBYAO3FBHIGoYwdm/g6GyQbZNyfFJRDqIPr08NxkKdvVPxhHAYkE8KOcaTAZJwCVmPkSUrZ04NHWRp0MJ2FG8fD93epSUwIhTonoM8BTYtX+OFkPwkCEAhiVRYuITpxLczs/lwOrII6ZqOUXlJhPs3N5uCiIhvsd8fogDEQggJ9vRE1l6MpNnlEYqgwudCXCy8pTY429tYGaA4KnuZncCRJqIIBRWZh2KRX3eSV7lBVX0cldaDxlS+5CiC4RNZn5W3Ui/avmdxuH98wZwPe5mdxeFMTA4TXBYTZzc3mwLIoxQK/Zsnb8ROlbgest0YNBXzTyjELPpSJBevtVY827awMdXQWADyu3svc8hi8At/xaQIoyNQKOkia3tQN8BfNYa0F3UHUi64kAsFJ7REYHhP00AMA4Z1Y9MoyL1ABApIWUjP8HtPbcYO6mAaCHSdOuAKih9ZCqArqDwIPEAK7fig5Ax1o4zJi6QyUpCD28iFCyYynuV+6kM8o9x1+Em9imbPYG4GFuJvfcVkoGwGnhZUGY2iN0R/iZVNggeqQBhlFP2gl2ByhlhpXfNrKgWzlmY1y4VVgURM/p5+ij50d+LjvLotCju6a1VL1bmb7+ERZuVLadrQnGIDe32stXohspSMX93F/ZdZPrVqxMrEZQnlA3fFhA7FGqK8GWPLDLtiH0bPD6v7MfrJxJR1lx5iwsjg7CNqaY+4D2Bedoy2WoQWWyPvfeSvsHYOx7rTrKikM14A3+SEU0/U9vRJT+8UJxYmoqFsXskIB3cd5n4Fd+ZtXiLKuRFLgJvQtKFIgw1ccaREEJniZkMATd/9VbqxsFMhEF3mDX5ewgyB2DHC8MTGwK3CBBekjCuxdQYgD6Y0cPMJ35oA/fG2vUk/yQpKbA/fD5yl6dyNO4vL+4Am4AvTvqv6MkontRF6S5YdQ3qTQQFTTJ83/+27ww2VdnUwAAAABJRU5ErkJggg=='
  })
  this.style = new ol.style.Style({fill: fill, stroke: stroke, image: icon});
  this.featureSource = new ol.source.Vector();
  this.drawOverlay = new ol.layer.Vector({
    source: this.featureSource
  });
  this.drawOverlay.setStyle(this.style);
  this.setMap(map);
  olPlot.Event.Observable.call(this)
};

olPlot.Utils.inherits(olPlot.PlotDraw, olPlot.Event.Observable);

olPlot.PlotDraw.prototype.activate = function (type, params) {
  this.deactivate();
  this.deactivateMapTools();
  this.map.on("click", this.mapFirstClickHandler, this);
  this.plotType = type;
  this.plotParams = params;
  this.map.addLayer(this.drawOverlay);
};

olPlot.PlotDraw.prototype.deactivate = function () {
  this.disconnectEventHandlers();
  this.map.removeLayer(this.drawOverlay);
  this.featureSource.clear();
  this.points = [];
  this.plot = null;
  this.feature = null;
  this.plotType = null;
  this.plotParams = null;
  this.activateMapTools();
};

olPlot.PlotDraw.prototype.isDrawing = function () {
  return this.plotType != null;
};

olPlot.PlotDraw.prototype.setMap = function (value) {
  this.map = value;
  this.mapViewport = this.map.getViewport();
};

olPlot.PlotDraw.prototype.mapFirstClickHandler = function (e) {
  this.points.push(e.coordinate);
  this.plot = olPlot.PlotFactory.createPlot(this.plotType, this.points, this.plotParams);
  this.feature = new ol.Feature(this.plot);
  this.featureSource.addFeature(this.feature);
  this.map.un("click", this.mapFirstClickHandler, this);
  //
  if (this.plot.fixPointCount == this.plot.getPointCount()) {
    this.mapDoubleClickHandler(e);
    return;
  }
  //
  this.map.on("click", this.mapNextClickHandler, this);
  if (!this.plot.freehand) {
    this.map.on("dblclick", this.mapDoubleClickHandler, this);
  }
  olPlot.Event.listen(this.mapViewport, olPlot.Event.EventType.MOUSEMOVE,
    this.mapMouseMoveHandler, this);
};

olPlot.PlotDraw.prototype.mapMouseMoveHandler = function (e) {
  var coordinate = this.map.getCoordinateFromPixel([e.offsetX, e.offsetY]);
  if (olPlot.PlotUtils.distance(coordinate, this.points[this.points.length - 1]) < olPlot.Constants.ZERO_TOLERANCE)
    return;
  if (!this.plot.freehand) {
    var pnts = this.points.concat([coordinate]);
    this.plot.setPoints(pnts);
  } else {
    this.points.push(coordinate);
    this.plot.setPoints(this.points);
  }
};

olPlot.PlotDraw.prototype.mapNextClickHandler = function (e) {
  if (!this.plot.freehand) {
    if (olPlot.PlotUtils.distance(e.coordinate, this.points[this.points.length - 1]) < olPlot.Constants.ZERO_TOLERANCE)
      return;
  }
  this.points.push(e.coordinate);
  this.plot.setPoints(this.points);
  if (this.plot.fixPointCount === this.plot.getPointCount()) {
    this.mapDoubleClickHandler(e);
    return;
  }
  if (this.plot && this.plot.freehand) {
    this.mapDoubleClickHandler(e);
  }
};

olPlot.PlotDraw.prototype.mapDoubleClickHandler = function (e) {
  this.disconnectEventHandlers();
  this.plot.finishDrawing();
  e.preventDefault();
  this.drawEnd(e);
};

olPlot.PlotDraw.prototype.disconnectEventHandlers = function () {
  this.map.un("click", this.mapFirstClickHandler, this);
  this.map.un("click", this.mapNextClickHandler, this);
  olPlot.Event.unListen(this.mapViewport, olPlot.Event.EventType.MOUSEMOVE,
    this.mapMouseMoveHandler, this);
  this.map.un("dblclick", this.mapDoubleClickHandler, this);
};

olPlot.PlotDraw.prototype.drawEnd = function (event) {
  this.featureSource.removeFeature(this.feature);
  this.activateMapTools();
  this.disconnectEventHandlers();
  this.map.removeOverlay(this.drawOverlay);
  this.points = [];
  this.plot = null;
  this.plotType = null;
  this.plotParams = null;
  this.dispatch(olPlot.Event.EventType.DRAW_END, {
    originalEvent: event,
    feature: this.feature
  });
  this.feature = null;
};

olPlot.PlotDraw.prototype.deactivateMapTools = function () {
  var interactions = this.map.getInteractions();
  var length = interactions.getLength();
  for (var i = 0; i < length; i++) {
    var item = interactions.item(i);
    if (item instanceof ol.interaction.DoubleClickZoom) {
      this.dblClickZoomInteraction = item;
      interactions.remove(item);
      break;
    }
  }
};

olPlot.PlotDraw.prototype.activateMapTools = function () {
  if (this.dblClickZoomInteraction != null) {
    this.map.getInteractions().push(this.dblClickZoomInteraction);
    this.dblClickZoomInteraction = null;
  }
};
olPlot.PlotEdit = function (map) {
  if (!map) {
    return;
  }
  this.activePlot = null;
  this.startPoint = null;
  this.ghostControlPoints = null;
  this.controlPoints = null;
  this.map = map;
  this.mapViewport = this.map.getViewport();
  this.mouseOver = false;
  this.elementTable = {};
  this.activeControlPointId = null;
  this.mapDragPan = null;
  olPlot.Event.Observable.call(this)
};

olPlot.Utils.inherits(olPlot.PlotEdit, olPlot.Event.Observable);

olPlot.PlotEdit.prototype.Constants = {
  HELPER_HIDDEN_DIV: 'olPlot-helper-hidden-div',
  HELPER_CONTROL_POINT_DIV: 'olPlot-helper-control-point-div'
};

olPlot.PlotEdit.prototype.initHelperDom = function () {
  if (!this.map || !this.activePlot) {
    return;
  }
  var parent = this.getMapParentElement();
  if (!parent) {
    return;
  }
  var hiddenDiv = olPlot.DomUtils.createHidden('div', parent, this.Constants.HELPER_HIDDEN_DIV);

  var cPnts = this.getControlPoints();
  for (var i = 0; i < cPnts.length; i++) {
    var id = this.Constants.HELPER_CONTROL_POINT_DIV + '-' + i;
    olPlot.DomUtils.create('div', this.Constants.HELPER_CONTROL_POINT_DIV, hiddenDiv, id);
    this.elementTable[id] = i;
  }
};

olPlot.PlotEdit.prototype.getMapParentElement = function () {
  var mapElement = this.map.getTargetElement();
  if (!mapElement) {
    return;
  }
  return mapElement.parentNode;
};

olPlot.PlotEdit.prototype.destroyHelperDom = function () {
  //
  if (this.controlPoints) {
    for (var i = 0; i < this.controlPoints.length; i++) {
      this.map.removeOverlay(this.controlPoints[i]);
      var element = olPlot.DomUtils.get(this.Constants.HELPER_CONTROL_POINT_DIV + '-' + i);
      if (element) {
        olPlot.DomUtils.removeListener(element, 'mousedown', this.controlPointMouseDownHandler, this);
        olPlot.DomUtils.removeListener(element, 'mousemove', this.controlPointMouseMoveHandler2, this);
      }
    }
    this.controlPoints = null;
  }
  //
  var parent = this.getMapParentElement();
  var hiddenDiv = olPlot.DomUtils.get(this.Constants.HELPER_HIDDEN_DIV);
  if (hiddenDiv && parent) {
    olPlot.DomUtils.remove(hiddenDiv, parent);
  }
};

olPlot.PlotEdit.prototype.initControlPoints = function () {
  if (!this.map) {
    return;
  }
  this.controlPoints = [];
  var cPnts = this.getControlPoints();
  for (var i = 0; i < cPnts.length; i++) {
    var id = this.Constants.HELPER_CONTROL_POINT_DIV + '-' + i;
    var element = olPlot.DomUtils.get(id);
    var pnt = new ol.Overlay({
      id: id,
      position: cPnts[i],
      positioning: 'center-center',
      element: element
    });
    this.controlPoints.push(pnt);
    this.map.addOverlay(pnt);
    olPlot.DomUtils.addListener(element, 'mousedown', this.controlPointMouseDownHandler, this);
    olPlot.DomUtils.addListener(element, 'mousemove', this.controlPointMouseMoveHandler2, this);
  }
};

olPlot.PlotEdit.prototype.controlPointMouseMoveHandler2 = function (e) {
  e.stopImmediatePropagation();
};

olPlot.PlotEdit.prototype.controlPointMouseDownHandler = function (e) {
  var id = e.target.id;
  this.activeControlPointId = id;
  olPlot.Event.listen(this.mapViewport, olPlot.Event.EventType.MOUSEMOVE, this.controlPointMouseMoveHandler, this);
  olPlot.Event.listen(this.mapViewport, olPlot.Event.EventType.MOUSEUP, this.controlPointMouseUpHandler, this);
};

olPlot.PlotEdit.prototype.controlPointMouseMoveHandler = function (e) {
  var coordinate = this.map.getCoordinateFromPixel([e.offsetX, e.offsetY]);
  if (this.activeControlPointId) {
    var plot = this.activePlot.getGeometry();
    var index = this.elementTable[this.activeControlPointId];
    plot.updatePoint(coordinate, index);
    var overlay = this.map.getOverlayById(this.activeControlPointId);
    overlay.setPosition(coordinate);
  }
};

olPlot.PlotEdit.prototype.controlPointMouseUpHandler = function (e) {
  olPlot.Event.unListen(this.mapViewport, olPlot.Event.EventType.MOUSEMOVE,
    this.controlPointMouseMoveHandler, this);
  olPlot.Event.unListen(this.mapViewport, olPlot.Event.EventType.MOUSEUP,
    this.controlPointMouseUpHandler, this);
};

olPlot.PlotEdit.prototype.activate = function (plot) {

  if (!plot || !(plot instanceof ol.Feature) || plot == this.activePlot) {
    return;
  }

  var geom = plot.getGeometry();
  if (!geom.isPlot()) {
    return;
  }

  this.deactivate();

  this.activePlot = plot;
  //
  this.map.on("pointermove", this.plotMouseOverOutHandler, this);

  this.initHelperDom();
  //
  this.initControlPoints();
  //
};

olPlot.PlotEdit.prototype.getControlPoints = function () {
  if (!this.activePlot) {
    return [];
  }
  var geom = this.activePlot.getGeometry();
  return geom.getPoints();
};

olPlot.PlotEdit.prototype.plotMouseOverOutHandler = function (e) {
  var feature = this.map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
    return feature;
  });
  if (feature && feature == this.activePlot) {
    if (!this.mouseOver) {
      this.mouseOver = true;
      this.map.getViewport().style.cursor = 'move';
      this.map.on('pointerdown', this.plotMouseDownHandler, this);
    }
  } else {
    if (this.mouseOver) {
      this.mouseOver = false;
      this.map.getViewport().style.cursor = 'default';
      this.map.un('pointerdown', this.plotMouseDownHandler, this);
    }
  }
};

olPlot.PlotEdit.prototype.plotMouseDownHandler = function (e) {
  this.ghostControlPoints = this.getControlPoints();
  this.startPoint = e.coordinate;
  this.disableMapDragPan();
  this.map.on('pointerup', this.plotMouseUpHandler, this);
  this.map.on('pointerdrag', this.plotMouseMoveHandler, this);
};

olPlot.PlotEdit.prototype.plotMouseMoveHandler = function (e) {
  var point = e.coordinate;
  var dx = point[0] - this.startPoint[0];
  var dy = point[1] - this.startPoint[1];
  var newPoints = [];
  for (var i = 0; i < this.ghostControlPoints.length; i++) {
    var olPlot = this.ghostControlPoints[i];
    var coordinate = [olPlot[0] + dx, olPlot[1] + dy];
    newPoints.push(coordinate);
    var id = this.Constants.HELPER_CONTROL_POINT_DIV + '-' + i;
    var overlay = this.map.getOverlayById(id);
    overlay.setPosition(coordinate);
    overlay.setPositioning('center-center');
  }
  var plot = this.activePlot.getGeometry();
  plot.setPoints(newPoints);
};

olPlot.PlotEdit.prototype.plotMouseUpHandler = function (e) {
  this.enableMapDragPan();
  this.map.un('pointerup', this.plotMouseUpHandler, this);
  this.map.un('pointerdrag', this.plotMouseMoveHandler, this);
};

olPlot.PlotEdit.prototype.disconnectEventHandlers = function () {
  this.map.un('pointermove', this.plotMouseOverOutHandler, this);
  olPlot.Event.unListen(this.mapViewport, olPlot.Event.EventType.MOUSEMOVE,
    this.controlPointMouseMoveHandler, this);
  olPlot.Event.unListen(this.mapViewport, olPlot.Event.EventType.MOUSEUP,
    this.controlPointMouseUpHandler, this);
  this.map.un('pointerdown', this.plotMouseDownHandler, this);
  this.map.un('pointerup', this.plotMouseUpHandler, this);
  this.map.un('pointerdrag', this.plotMouseMoveHandler, this);
};

olPlot.PlotEdit.prototype.deactivate = function () {
  this.activePlot = null;
  this.mouseOver = false;
  this.destroyHelperDom();
  this.disconnectEventHandlers();
  this.elementTable = {};
  this.activeControlPointId = null;
  this.startPoint = null;
};

olPlot.PlotEdit.prototype.disableMapDragPan = function () {
  var interactions = this.map.getInteractions();
  var length = interactions.getLength();
  for (var i = 0; i < length; i++) {
    var item = interactions.item(i);
    if (item instanceof ol.interaction.DragPan) {
      this.mapDragPan = item;
      item.setActive(false);
      break;
    }
  }
};

olPlot.PlotEdit.prototype.enableMapDragPan = function () {
  if (this.mapDragPan != null) {
    this.mapDragPan.setActive(true);
    this.mapDragPan = null;
  }
};