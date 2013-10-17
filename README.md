# simple-rate-limiter

A simple way to limit how often a function is executed.

Currently works with node.js v0.10.1+ (and probably lower).

## Examples

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

## Edges cases

Basic api: `limit(func).to(count).per(interval)`

The `to` method or `per` can be called any number of times including zero.  The effective default count for `to` is 1 and the effective default interval for `per` is Infinity.  Which means if neither the `to` method or `per` method are called, then `limit` will only execute `func` once ever:

```javascript
var init = limit(function() { console.log("Runs only once"); });
for(var i = 0; i < 3; i++) { init(); }

/*** Console output: ***/
// $ Runs only once
// ... Nothing else is ever printed ...
```

Similarly, if `per` is never called, `func` is executed at most `count` number of times:

```javascript
var dos = limit(function() { console.log("twice only"); }).to(2);
for(var i = 0; i < 3; i++) { dos(); }

/*** Console output: ***/
// $ twice only
// $ twice only
// ... Nothing else is ever printed ...
```

On the other hand, if `to` is never called, `func` is only executed every `interval` milliseconds:

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
