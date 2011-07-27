(function(global) {
	function bind(fn, that, ret) {
		return function() {
			fn.apply(that, arguments);
			return ret;
		};
	}

	function D(func) {
		// invoked without new
		if (this === global)
			return new D();

		this.doneFuncs = [];
		this.failFuncs = [];
		this.resultArgs = null;
		this.status = '';

		// check for option function: call it with this as context and as first parameter, as specified in jQuery api
		if (func)
			func.apply(this, [this]);
	}

	function P(d) {
		this.then = bind(d.then, d, this);
		this.done = bind(d.done, d, this);
		this.fail = bind(d.fail, d, this);
		this.always = bind(d.always, d, this);
		this.isResolved = bind(d.isResolved, d, this);
		this.isRejected = bind(d.isRejected, d, this);
	}

	D.when = function() {
		if (arguments.length == 1)
			return  (arguments[0].constructor === D) ? arguments[0].promise() : arguments[0];
		else if (arguments.length > 1)
		{
			return (function(args){
				var df = new D(),
					size = args.length,
					done = 0,
					rp = new Array(size);	// resolve params: params of each resolve, we need to track down them to be able to pass them in the correct order if the master needs to be resolved

				for (var i = 0; i < args.length; i++) {
					(function(j) {
						args[j].done(function() { rp[j] = (arguments.length < 2) ? arguments[0] : arguments; if (++done == size) { df.resolve.apply(df, rp); /* console.log(rp); */ }})
						.fail(function() { df.reject(arguments); });
					})(i);
				}

				return df.promise();
			})(arguments);
		}
	}

	D.prototype.isResolved = function() {
		return this.status === 'rs';
	}

	D.prototype.isRejected = function() {
		return this.status === 'rj';
	}

	D.prototype.promise = function() {
		var self = this,
		obj = (arguments.length < 1) ? new P(this) : arguments[0];

		// TODO: implement use case with object passed in parameter

		return obj;
	}

	D.prototype.reject = function() {
		return this.rejectWith(this, arguments);
	}	

	D.prototype.resolve = function() {
		return this.resolveWith(this, arguments);
	}

	D.prototype.exec = function(context, dst, args, st) {
		if (this.status !== '')
			return this;

		this.status = st;

		for (var i = 0; i < dst.length; i++)
			dst[i].apply(context, args);

		return this;
	}

	D.prototype.resolveWith = function(context) {
		var args = this.resultArgs = (arguments.length > 1) ? arguments[1] : [];

		return this.exec(context, this.doneFuncs, args, 'rs');
	}

	D.prototype.rejectWith = function(context) {
		var args = this.resultArgs = (arguments.length > 1) ? arguments[1] : [];

		return this.exec(context, this.failFuncs, args, 'rj');
	}

	D.prototype.done = function() {
		for (var i = 0; i < arguments.length; i++) {
			// skip any undefined or null arguments
			if (!arguments[i])
				continue;

			if (arguments[i].constructor === Array ) {
				var arr = arguments[i];
				for (var j = 0; j < arr.length; j++) {
					// immediately call the function if the deferred has been resolved
					if (this.status === 'rs')
						arr[j].apply(this, this.resultArgs);

					this.doneFuncs.push(arr[j]);
				}
			}
			else {
				// immediately call the function if the deferred has been resolved
				if (this.status === 'rs')
					arguments[i].apply(this, this.resultArgs);

				this.doneFuncs.push(arguments[i]);
			}
		}
		
		return this;
	}

	D.prototype.fail = function(func) {
		for (var i = 0; i < arguments.length; i++) {
			// skip any undefined or null arguments
			if (!arguments[i])
				continue;

			if (arguments[i].constructor === Array ) {
				var arr = arguments[i];
				for (var j = 0; j < arr.length; j++) {
					// immediately call the function if the deferred has been resolved
					if (this.status === 'rj')
						arr[j].apply(this, this.resultArgs);

					this.failFuncs.push(arr[j]);
				}
			}
			else {
				// immediately call the function if the deferred has been resolved
				if (this.status === 'rj')
					arguments[i].apply(this, this.resultArgs);

				this.failFuncs.push(arguments[i]);
			}
		}

		return this;
	}

	D.prototype.always = function() {
		if (arguments.length > 0 && arguments[0])
			this.done(arguments[0]).fail(arguments[0]);

		return this;
	}

	D.prototype.then = function() {
		// fail function(s)
		if (arguments.length > 1 && arguments[1])
			this.fail(arguments[1]);

		// done function(s)
		if (arguments.length > 0 && arguments[0])
			this.done(arguments[0]);

		return this;
	}

	global.Deferred = D;
})(window);