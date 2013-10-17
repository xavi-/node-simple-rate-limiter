var assert = require("assert");
var limit = require("./");

const SLOP = 5; // Timers don't seem accurate to the millisecond

var tests = {
	expected: 4,
	executed: 0,
	finished: function() { tests.executed++; }
};
function done(times, count, to, per) {
	for(var i = 0; i < count - to; i++) {
		var diff = (times[i + to].time - times[i].time) + SLOP;
		assert.ok(per <= diff, "Diff found: " + diff + "; Expected: " + per);
	}
	times.forEach(function(time, idx) { assert.equal(idx, time.idx); });
	tests.finished();
}

function runBasicTest(count, to, per) {
	var times = [];
	var saveTime = limit(function(idx) {
		times.push({ idx: idx, time: Date.now() });
		console.log("executed idx: %d/%d", idx, count);

		if(count <= times.length) { done(times, count, to, per); }
	}).to(0).per(0).to(to).per(per);

	for(var i = 0; i < count; i++) {
		saveTime(i);
	}
}

runBasicTest(50, 10, 1000);
runBasicTest(25, 1, 100);
runBasicTest(2500, 100, 10);
runBasicTest(101, 73, 1409);

process.on("exit", function() {
	assert.equal(tests.executed, tests.expected);
	console.log("\n\nAll done.  Everything passed.");
});
