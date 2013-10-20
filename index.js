var slice = Array.prototype.slice;

module.exports = function limit(fn) {
	var _to = 1, _per = -1, _fuzz = 0, _evenly = false;
	var pastExecs = [], queue = [], timer;

	var exec = function(fn, args) {
		pastExecs.push(Date.now());
		fn.apply(null, args);
	};

	var pump = function() {
		var now = Date.now();

		pastExecs = pastExecs.filter(function(time) { return (now - time < _per); });

		while(pastExecs.length < _to && queue.length > 0) {
			exec(fn, queue.shift());
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

	var limiter = function() {
		queue.push(slice.call(arguments, 0));

		if(!timer) { timer = setTimeout(pump, 0); }
	};

	limiter.to = function(count) { _to = count || 1; return limiter; };
	limiter.per = function(time) { _per = time || -1; return limiter; };
	limiter.evenly = function(evenly) { _evenly = (evenly == null) || evenly; return limiter; };
	limiter.withFuzz = function(fuzz) { _fuzz = fuzz || 0.1; return limiter; };

	return limiter;
};