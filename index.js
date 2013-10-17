var slice = Array.prototype.slice;

module.exports = function limit(fn) {
	var _to = 1, _per = -1, available = 1;
	var queue = [], timer;

	var pump = function() {
		available = _to;

		while(available > 0 && queue.length > 0) {
			fn.apply(null, queue.shift());
			available -= 1;
		}

		if(available === _to) { timer = null; }
		else { timer = setTimeout(pump, _per); }
	};

	var limiter = function() {
		if(available > 0) { fn.apply(null, arguments); available -= 1; }
		else if(_per > -1) { queue.push(slice.call(arguments, 0)); }

		if(!timer && _per > -1) { timer = setTimeout(pump, _per); }
	};

	limiter.to = function(count) {
		available = (available - _to) + count;
		_to = count;
		return limiter;
	};
	limiter.per = function(time) { _per = time; return limiter; };

	return limiter;
};