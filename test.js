var assert = require("assert");
var limit = require("./");
var EventEmitter = require("events").EventEmitter;

const SLOP = 5; // Timers don't seem accurate to the millisecond

var tests = {
	expected: 22,
	executed: 0,
	finished: function() { tests.executed++; }
};

function runBasicTest(count, to, per) {
	var times = [];
	var done = function() {
		for(var i = 0; i < count - to; i++) {
			var diff = (times[i + to].time - times[i].time) + SLOP;
			assert.ok(per <= diff, "Diff found: " + diff + "; Expected: " + per);
		}
		times.forEach(function(time, idx) { assert.equal(idx, time.idx); });
		tests.finished();
		console.log("Completed basic test -- count: %d, to: %d, per: %d", count, to, per);
	};
	var saveTime = limit(function(idx) {
		times.push({ idx: idx, time: Date.now() });

		if(count <= times.length) { done(times, count, to, per); }
	}).to(0).per(0).to(to).per(per);

	for(var i = 0; i < count; i++) {
		saveTime(i);
	}
	console.log("Starting basic test -- count: %d, to: %d, per: %d", count, to, per);
}

function runTickTests(count, per) {
	var prevTime, tick = limit(function(isLast) {
		var now = Date.now();
		if(prevTime) {
			var diff = now - prevTime;
			assert.ok(per <= diff + SLOP);
		}
		prevTime = now;
		if(isLast) {
			console.log("Completed tick test -- count: %d, per: %d", count, per);
			tests.finished();
		}
	}).per(per);
	for(var i = 0; i < count; i++) { tick(i + 1 === count); }
	console.log("Starting tick test -- count: %d, per: %d", count, per);
}


function runErraticQueueTest(count, to, per, erraticTimes) {
	var times = [];
	var done = function() {
		for(var i = 0; i < count - to; i++) {
			var diff = (times[i + to].time - times[i].time) + SLOP;
			assert.ok(per <= diff, "Diff found: " + diff + "; Expected: " + per + "; i: " + i);
		}
		times.forEach(function(time, idx) { assert.equal(idx, time.idx); });
		tests.finished();
		console.log("Completed erratic test -- count: %d, to: %d, per: %d", count, to, per);
	};
	var saveTime = limit(function(idx) {
		times.push({ idx: idx, time: Date.now() });

		if(count <= times.length) { done(times, count, to, per); }
	}).to(to).per(per);

	for(var i = 0; i < erraticTimes.length; i++) {
		setTimeout((function(idx) {
			return function() { saveTime(idx); };
		})(i), erraticTimes[i]);
	}
	console.log("Starting erratic test -- count: %d, to: %d, per: %d", count, to, per);
}

function runEvenlyTest(count, to, per) {
	var expDiff = per / count;
	var prevTime, even = limit(function(isLast) {
		var now = Date.now();
		if(prevTime) {
			var diff = (now - prevTime);
			assert.ok(expDiff - SLOP <= diff, "Expected: " + expDiff + "; actual: " + diff);
		}
		prevTime = now;
		if(isLast) {
			console.log("Completed evenly test -- count: %d, to: %d, per: %d", count, to, per);
			tests.finished();
		}
	}).to(count).per(per).evenly();
	for(var i = 0; i < count; i++) { even(i + 1 === count); }
	console.log("Starting evenly test -- count: %d, to: %d, per: %d", count, to, per);
}

function runFunctionLengthTest() {
	console.log("Run function length test");
	function original(param1, param2, param3){
		return;
	}
	var limited = limit(original);
	assert.equal(limited.length, original.length, "Expected function length to be equal")
}

function runMaxQueueLengthTest() {
	console.log("Run max queue length test");

	const limited = limit(() => {}).maxQueueLength(10);

	try {
		for (let i = 0; i < 100; i++) {
			limited("hit the limit");
		}

		assert.fail("Expected error to be thrown");
	} catch (err) {
		assert.ok(err.message.includes("queue length"));
	}
}

function runFunctionContextTest() {
	console.log("Run function context test");

	var SomeFn = function() {
		this.value = "something";

		this.getSomething = limit(function() {
			return this.value;
		}, this).to(10).per(1000);
	}

	var obj = new SomeFn();
	obj.getSomething().on("limiter-exec", function(rtn) {
		assert.equal(rtn, "something");
		tests.finished();
	});
}


runBasicTest(50, 10, 1000);
runBasicTest(25, 1, 100);
runBasicTest(2500, 100, 10);
runBasicTest(101, 73, 1409);

runTickTests(3, 1000);
runTickTests(25, 100);
runTickTests(250, 10);
runTickTests(3, 1409);

const erraticTimes = [
	[
		0, 800, 800, 800, 850, 850, 850, 1050, 1100, 1100, 1100, 1100, 1800, 1800, 1800, 1800,
		1800, 2100, 2100, 2100
	],
	[
		0, 837, 841, 843, 844, 850, 974, 985, 987, 995, 1121, 1446, 1689, 1691, 1697, 1698, 1712,
		1825, 1827, 1828, 1833, 2218, 2675, 2677, 2678, 2682, 2684, 2814, 2815, 2816, 2817, 3214,
		3668, 3681, 3683, 3686, 3690, 3808, 3821, 3823, 3824, 4218, 4664, 4668, 4676, 4680, 4682,
		4796, 4797, 4814, 4822, 5214, 5678
	],
	[
		0, 3191, 3205, 3211, 3216, 3222, 3227, 3234, 3240, 3245, 3251, 3258, 3275, 3361, 3381,
		3391, 3408, 3424, 3461, 3473, 3498, 3508, 3522, 3548, 3554, 3561, 3584, 3590, 3607, 3620,
		3627, 3637, 3664, 3698, 3706, 3720, 3726, 3752, 3759, 3772, 3784, 3798, 3807, 3819, 3829,
		3848, 3863, 3875, 3888, 3895, 3909, 3920, 3926
	]
];
for(const times of erraticTimes) {
	runErraticQueueTest(times.length, 10, 1000, times);
}

runEvenlyTest(50, 17, 701);
runEvenlyTest(50, 10, 1000);
runEvenlyTest(25, 1, 100);
runEvenlyTest(101, 73, 1409);

runFunctionLengthTest();

runMaxQueueLengthTest();

runFunctionContextTest();

var init = limit(function() { assert.ok(init.calls++ < 1); tests.finished(); });
init.calls = 0;
for(var i = 0; i < 5; i++) { init(); }

var dos = limit(function() { assert.ok(dos.calls++ < 2); tests.finished(); }).to(2);
dos.calls = 0;
for(var i = 0; i < 5; i++) { dos(); }

var isSet = false;
limit(function() { assert.ok(isSet); tests.finished(); })();
isSet = true;

var rtnVal;
var emitterTest = limit(function() {
	var emitter = new EventEmitter();
	setTimeout(function() { emitter.emit("hi", 1, 2, 3); });

	rtnVal = emitter;
	return rtnVal;
});

emitterTest()
	.on("limiter-exec", function(rtn) {
		console.log("Limiter executed event.");
		assert.equal(rtn, rtnVal);
		tests.finished();
	})
	.on("hi", function(a, b, c) {
		console.log("Re-emitter message sent.");
		assert.equal(a, 1);
		assert.equal(b, 2);
		assert.equal(c, 3);
		tests.finished();
	})
;

process.on("exit", function() {
	assert.equal(tests.executed, tests.expected);
	console.log("\n\nAll done.  Everything passed.");
});
