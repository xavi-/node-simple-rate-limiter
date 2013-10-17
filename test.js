var assert = require("assert");
var limit = require("./");

const COUNT = 50, TO = 10, PER = 1000;

function done() {
	for(var i = 0; i < COUNT - TO; i++) {
		var diff = times[i + TO].time - times[i].time;
		assert.ok(PER <= diff, "Diff found: " + diff);
	}
	times.forEach(function(time, idx) { assert.equal(idx, time.idx); });
}

var times = [];
var saveTime = limit(function(idx) {
	times.push({ idx: idx, time: Date.now() });
	console.log("executed idx: %d/%d", idx, COUNT);

	if(COUNT <= times.length) { done(); }
}).to(TO).per(PER);

for(var i = 0; i < COUNT; i++) {
	saveTime(i);
}