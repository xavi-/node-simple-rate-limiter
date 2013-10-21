var assert = require("assert");
var limit = require("./");

const SLOP = 5; // Timers don't seem accurate to the millisecond

var tests = {
	expected: 296,
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
	var tick = limit(function() {
		if(!tick.lastCalled) { tick.lastCalled = Date.now(); }
		else {
			var now = Date.now();
			assert.ok(per <= (now - tick.lastCalled) + SLOP);
			tick.lastCalled = now;
		}
		tests.finished();
	}).per(per);
	for(var i = 0; i < count; i++) { tick(); }
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
		if(prevTime) {
			var diff = (Date.now() - prevTime);
			assert.ok(diff < expDiff + SLOP, "Expected: " + expDiff + "; actual: " + diff);
			assert.ok(expDiff - SLOP < diff, "Expected: " + expDiff + "; actual: " + diff);
		}
		prevTime = Date.now();
		if(isLast) {
			console.log("Completed evenly test -- count: %d, to: %d, per: %d", count, to, per);
			tests.finished();
		}
	}).to(count).per(per).evenly();
	for(var i = 0; i < count; i++) { even(i + 1 === count); }
	console.log("Starting evenly test -- count: %d, to: %d, per: %d", count, to, per);
}

runBasicTest(50, 10, 1000);
runBasicTest(25, 1, 100);
runBasicTest(2500, 100, 10);
runBasicTest(101, 73, 1409);

runTickTests(3, 1000);
runTickTests(25, 100);
runTickTests(250, 10);
runTickTests(3, 1409);

var erraticTimes = [
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
erraticTimes.forEach(function(times) { runErraticQueueTest(times.length, 10, 1000, times); });


runEvenlyTest(50, 17, 701);
runEvenlyTest(50, 10, 1000);
runEvenlyTest(25, 1, 100);
runEvenlyTest(101, 73, 1409);

var init = limit(function() { assert.ok(init.calls++ < 1); tests.finished(); });
init.calls = 0;
for(var i = 0; i < 5; i++) { init(); }

var dos = limit(function() { assert.ok(dos.calls++ < 2); tests.finished(); }).to(2);
dos.calls = 0;
for(var i = 0; i < 5; i++) { dos(); }

var isSet = false;
limit(function() { assert.ok(isSet); tests.finished(); })();
isSet = true;

process.on("exit", function() {
	assert.equal(tests.executed, tests.expected);
	console.log("\n\nAll done.  Everything passed.");
});
