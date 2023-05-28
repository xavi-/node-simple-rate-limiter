const EventEmitter = require("events").EventEmitter;

function reEmit(oriEmitter, newEmitter) {
	var oriEmit = oriEmitter.emit, newEmit = newEmitter.emit;
	oriEmitter.emit = function() {
		newEmit.apply(newEmitter, arguments);
		oriEmit.apply(oriEmitter, arguments);
	};
}

function limit(fn, ctx) {
	var _to = 1, _per = -1, _fuzz = 0, _evenly = false, _maxQueueLength = 5000;
	var pastExecs = [], queue = [], timer;

	var pump = function() {
		var now = Date.now();

		pastExecs = pastExecs.filter(function(time) { return (now - time < _per); });

		while(pastExecs.length < _to && queue.length > 0) {
			pastExecs.push(now);

			var tmp = queue.shift();
			var rtn = fn.apply(ctx, tmp.args);
			tmp.emitter.emit("limiter-exec", rtn);

			if(rtn && rtn.emit) { reEmit(rtn, tmp.emitter); }

			if(_evenly) { break; } // Ensures only one function is executed every pump
		}

		if(pastExecs.length <= 0) { timer = null; }
		else if(queue.length <= 0) { // Clear pastExec array when queue is empty asap
			var lastIdx = pastExecs.length - 1;
			timer = setTimeout(pump, _per - (now - pastExecs[lastIdx]));
		} else if(_per > -1) {
			var delay = (_evenly ? _per / _to : _per - (now - pastExecs[0]));
			delay += (delay * _fuzz * Math.random()) | 0;
			timer = setTimeout(pump, delay);
		}
	};

	var limiter = function(...args) {
		if(_maxQueueLength <= queue.length) {
			throw new Error(`Max queue length (${_maxQueueLength}) exceeded`);
		}

		var emitter = new EventEmitter();

		queue.push({ emitter, args });

		if(!timer) { timer = setImmediate(pump); }

		return emitter;
	};
	Object.defineProperty(limiter, "length", { value: fn.length }); // Match fn signature

	limiter.to = function(count) { _to = count || 1; return limiter; };
	limiter.per = function(time) { _per = time || -1; return limiter; };
	limiter.evenly = function(evenly) { _evenly = (evenly == null) || evenly; return limiter; };
	limiter.withFuzz = function(fuzz) { _fuzz = fuzz || 0.1; return limiter; };
	limiter.maxQueueLength = function(max) { _maxQueueLength = max; return limiter; };

	return limiter;
};

limit.promise = function(promiser, ctx) {
	const limiter = limit(promiser, ctx);

	function wrapper(...args) {
		return new Promise(function(resolve, reject) {
			limiter(...args).on("limiter-exec", rtn => rtn.then(resolve).catch(reject));
		});
	};
	Object.defineProperty(wrapper, "length", { value: promiser.length }); // Match promiser signature

	wrapper.to = function(count) { limiter.to(count); return wrapper; };
	wrapper.per = function(time) { limiter.per(time); return wrapper; };
	wrapper.evenly = function(evenly) { limiter.evenly(evenly);  return wrapper; };
	wrapper.withFuzz = function(fuzz) { limiter.fuzz(fuzz); return wrapper; };
	wrapper.maxQueueLength = function(max) { limiter.maxQueueLength(max); return wrapper; };

	return wrapper;
};

module.exports = limit;
