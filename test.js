var assert = require("assert");
var limit = require("./");

const SLOP = 5; // Timers don't seem accurate to the millisecond

var tests = {
	expected: 289,
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


(function runErraticQueueTest(count, to, per) {
	var times = [];
	var done = function() {
		for(var i = 0; i < count - to; i++) {
			var diff = (times[i + to].time - times[i].time) + SLOP;
			assert.ok(per <= diff, "Diff found: " + diff + "; Expected: " + per + "; i: " + i);
		}
		times.forEach(function(time, idx) { assert.equal(idx, time.idx); });
		tests.finished();
	};
	var saveTime = limit(function(idx) {
		times.push({ idx: idx, time: Date.now() });
		console.log("Erratic executed idx: %d/%d", idx, count);

		if(count <= times.length) { done(times, count, to, per); }
	}).to(to).per(per);

	setTimeout(function() { saveTime(0) }, 0);
	setTimeout(function() { saveTime(1) }, 800);
	setTimeout(function() { saveTime(2) }, 800);
	setTimeout(function() { saveTime(3) }, 800);
	setTimeout(function() { saveTime(4) }, 850);
	setTimeout(function() { saveTime(5) }, 850);
	setTimeout(function() { saveTime(6) }, 850);
	setTimeout(function() { saveTime(7) }, 1050);
	setTimeout(function() { saveTime(8) }, 1100);
	setTimeout(function() { saveTime(9) }, 1100);
	setTimeout(function() { saveTime(10) }, 1100);
	setTimeout(function() { saveTime(11) }, 1100);
	setTimeout(function() { saveTime(12) }, 1800);
	setTimeout(function() { saveTime(13) }, 1800);
	setTimeout(function() { saveTime(14) }, 1800);
	setTimeout(function() { saveTime(15) }, 1800);
	setTimeout(function() { saveTime(16) }, 1800);
	setTimeout(function() { saveTime(17) }, 2100);
	setTimeout(function() { saveTime(18) }, 2100);
	setTimeout(function() { saveTime(19) }, 2100);
})(20, 10, 1000);

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
