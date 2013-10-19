var slice = Array.prototype.slice;

module.exports = function limit(fn) {
	var _to = 1, _per = -1;
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
		}

		if(pastExecs.length <= 0) { timer = null; }
		else if(queue.length <= 0) { // Clear pastExec array when queue is empty asap
			var lastIdx = pastExecs.length - 1;
			timer = setTimeout(pump, _per - (now - pastExecs[lastIdx]));
		} else { timer = setTimeout(pump, _per - (now - pastExecs[0])); }
	};

	var limiter = function() {
		if(pastExecs.length < _to) { exec(fn, arguments); }
		else if(_per > -1) { queue.push(slice.call(arguments, 0)); }

		if(!timer && _per > -1) { timer = setTimeout(pump, _per); }
	};

	limiter.to = function(count) { _to = count; return limiter; };
	limiter.per = function(time) { _per = time; return limiter; };

	return limiter;
};