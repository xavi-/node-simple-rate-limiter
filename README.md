# simple-rate-limiter

A simple way to limit how often a function is executed.

## Examples

If you want to limit _all_ requests:

```javascript
var limit = require("simple-rate-limiter");
var request = limit(require("request")).to(10).per(1000);

userIds.forEach(function(userId) {
	var url = "http://easily-overwhelmed-api.com/users/" + userId;
	request(url, function(err, res, body) {
		/* ... Yay! Not a too-many-request-per-second error! ... */
	});
})
```

Or if you'd like to be a bit more fine grain and/or explicit:

```javascript
var limit = require("simple-rate-limiter");
var callApi = limit(function(userId, callback) {
	var url = "http://easily-overwhelmed-api.com/users/" + userId;
	request(url, callback);
}).to(10).per(1000);

userIds.forEach(function(userId) {
	callApi(userId, function(err, res, body) {
		/* ... Yay! Not a too-many-request-per-second error! ... */
	});
})
```

## API

Basic usage: `let limited = limit(fn)`

- `limited(args...)`: Enqueues a set of arguments that `fn` will be executed with.  Returns an [EventEmitter](http://nodejs.org/docs/latest/api/events.html#events_class_events_eventemitter) that will emit a `limiter-exec` event when `fn` is executed with `args`.  Also, in the case that `fn` returns an EventEmitter, the events emmitted by the returned EventEmitter will be relayed to the EventEmitter returned by `limited`.  In other words, stuff like this works:

	```javascript
	var limit = require("simple-rate-limiter");
	var request = require("request");
	limit(request)("http://google.com").on("data", function(chunk) { /*** code ***/ });
	```

- `limited.to(count=1)`: The number of times `fn` will be execute within the time specified by `.per(time)`.
- `limited.per(time=Infinity)`: The number of milliseconds in which `fn` will be executed `.to(count)` number of times.
- `limited.evenly([toggle=true])`: Off by default.  When true, `fn` will be executed evenly through the time period specified by `.per(time)`.  For example, if set to true and `.to(10)` and `.per(1000)`, then `fn` will be executed every 100ms.
- `limited.withFuzz([percent=0.1])`: Set to 0 by default.  Adds a random factor to the delay time.  For example if set to 0.1 and `.to(10)` and `.per(1000)`, then `fn` will be executed between every 100ms to 110ms.
- `limited.maxQueueLength(max)`: Set to 5,000 by default.  If more than 5,000 pending actions are queued, then an exception will be thrown.

All methods attached to `limited` and can be chained.

Context for a function can be set with `limit(fn, ctx)` or `limit.promise(promiser, ctx)`.

### Promises

Simple rate limiter supports promises with `limit.promise`.  Limited promises have support the same chainable methods as `limit`.  Example usage:

```js
const limited = limit.promise(getUser).to(10).per(1000);

const users = await Promise.all(userIds.map(id => limited(id)));

/* ... Yay, I didn't spam anyone! ... */
```

- `limit.promise(promiser[, ctx])`: Returns a promise.  Calls the `promises` no more often than the `to` and `per` fields dictate.  An optional context parameter can be passed in.


## Edge cases

Basic usage: `limit(fn).to(count).per(interval)`

The `to` method or `per` can be called any number of times including zero.  The effective default count for `to` is 1 and the effective default interval for `per` is Infinity.  Which means if neither the `to` method or `per` method are called, then `limit` will only execute `fn` once ever:

```javascript
var init = limit(function() { console.log("Runs only once"); });
for(var i = 0; i < 3; i++) { init(); }

/*** Console output: ***/
// $ Runs only once
// ... Nothing else is ever printed ...
```

Similarly, if `per` is never called, `fn` is executed at most `count` number of times:

```javascript
var dos = limit(function() { console.log("twice only"); }).to(2);
for(var i = 0; i < 3; i++) { dos(); }

/*** Console output: ***/
// $ twice only
// $ twice only
// ... Nothing else is ever printed ...
```

On the other hand, if `to` is never called, `fn` is only executed every `interval` milliseconds:

```javascript
var tick = limit(function() { console.log("Once a second..."); }).per(1000);
for(var i = 0; i < 3; i++) { tick(); }

/*** Console output: ***/
// $ Once a second
// ... pause for 1 second ...
// $ Once a second
// ... pause for 1 second ...
// $ Once a second
```

Finally, as mentioned earlier, `to` and `per` can be called any number of times.  Each time either `to` or `per` is called, the previous `count` or `interval` value is overriden:

```javascript
var strange = limit(function() {
	console.log("Every once in a while");
}).to(1).per(1000).to(2).per(2000);
for(var i = 0; i < 3; i++) { strange(); }

/*** Console output: ***/
// $ Every once in a while
// $ Every once in a while
// ... pause for 2 second ...
// $ Every once in a while
```

## Getting simple-rate-limiter

The easiest way to get simple-rate-limiter is with [npm](http://npmjs.org/):

    npm install simple-rate-limiter

Alternatively you can clone this git repository:

    git clone git://github.com/xavi-/node-simple-rate-limiter.git


## Developed by
* Xavi Ramirez

## License
This project is released under [The MIT License](http://www.opensource.org/licenses/mit-license.php).
