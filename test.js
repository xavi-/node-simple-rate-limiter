var assert = require("assert");
var limit = require("./");

const SLOP = 5; // Timers don't seem accurate to the millisecond

var tests = {
	expected: 288,
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
	};
	var saveTime = limit(function(idx) {
		times.push({ idx: idx, time: Date.now() });
		console.log("executed idx: %d/%d", idx, count);

		if(count <= times.length) { done(times, count, to, per); }
	}).to(0).per(0).to(to).per(per);

	for(var i = 0; i < count; i++) {
		saveTime(i);
	}
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

runBasicTest(50, 10, 1000);
runBasicTest(25, 1, 100);
runBasicTest(2500, 100, 10);
runBasicTest(101, 73, 1409);

runTickTests(3, 1000);
runTickTests(25, 100);
runTickTests(250, 10);
runTickTests(3, 1409);

var init = limit(function() { assert.ok(init.calls++ < 1); tests.finished(); });
init.calls = 0;
for(var i = 0; i < 5; i++) { init(); }

var dos = limit(function() { assert.ok(dos.calls++ < 2); tests.finished(); }).to(2);
dos.calls = 0;
for(var i = 0; i < 5; i++) { dos(); }

process.on("exit", function() {
	assert.equal(tests.executed, tests.expected);
	console.log("\n\nAll done.  Everything passed.");
});
