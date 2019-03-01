/**
 * Created by Raion on 2019/2/24.
 */

'use strict';

var MyPromise = (function () {
  var PENDING = 'pending';
  var FULFILLED = 'fulfilled';
  var REJECTED = 'rejected';

  function MyPromise(excutor) {
    if (typeof excutor !== 'function') {
      throw new TypeError('Promise resolver ' + excutor + ' is not a function');
    }
    if (!(this instanceof MyPromise)) {
      throw new TypeError(this + ' is not promise');
    }
    var self = this;
    self.value = null;
    self.reason = null;
    self.status = PENDING;
    self.onFulfilled = [];
    self.onRejected = [];
    function resolve(value) {
      if (value instanceof MyPromise) {
        return value.then(resolve, reject);
      }
      setTimeout(function() {
        if (self.status === PENDING) { //事件循环机制，解决同时调用resolve和reject可以触发两次状态更改
          self.value = value;
          self.status = FULFILLED;
          for (var i = 0; i < self.onFulfilled.length; i++) {
            self.onFulfilled[i](self.value);
          }
        }
      });
    }
    function reject(reason) {
      setTimeout(function() {
        if (self.status === PENDING) {
          self.reason = reason;
          self.status = REJECTED;
          for (var i = 0; i < self.onRejected.length; i++) {
            self.onRejected[i](self.reason);
          }
        }
      });
    }
    try {
      excutor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }
  MyPromise.prototype.then = function(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : function(v) { return v };
    onRejected = typeof onRejected === 'function' ? onRejected : function(e) { throw e };
    var self = this;
    var promise = null;
    if (self.status === PENDING) {
      return promise = new MyPromise(function(resolve, reject) {
        self.onFulfilled.push(function (value) {
          try {
            var x = onFulfilled(value);
            resolvePromise(promise, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
        self.onRejected.push(function (reason) {
          try {
            var x = onRejected(reason);
            resolvePromise(promise, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      });
    } else if (self.status === FULFILLED) {
      return promise = new MyPromise(function (resolve, reject) {
        setTimeout(function () { // 按顺序执行promise，后面promise需要等待上一个promise状态更改才能执行
          try {
            var x = onFulfilled(self.value);
            resolvePromise(promise, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      })
    } else if (self.status === REJECTED) {
      return promise = new MyPromise(function (resolve, reject) {
        setTimeout(function () {
          try {
            var x = onRejected(self.reason);
            resolvePromise(promise, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      })
    }
  }

  MyPromise.prototype.catch = function (onRejected) {
    return this.then(null, onRejected);
  }

  // 返回一个Promise，在promise执行结束时，无论结果是fulfilled或者是rejected，在执行then()和catch()后，都会执行finally指定的回调函数
  MyPromise.prototype.finally = function (fn) {
    return this.then(function (v) {
      setTimeout(fn);
      return v;
    }, function (e) {
      setTimeout(fn);
      throw e;
    })
  }

  function resolvePromise(promise, x, resolve, reject) {
    if (promise === x) {
      return reject(new TypeError('Chaining cycle detected for promise!'));
    }
    var thenCalledOrThrow = false; // 禁止调用多次
    if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
      try { // 如果x.then抛出异常，则以这个异常将promise拒绝
        var then = x.then;
        if (typeof then === 'function') {
          then.call(x, function (y) { // y仍有可能是PROMISE
            if (thenCalledOrThrow) {
              return;
            }
            thenCalledOrThrow = true;
            resolvePromise(promise, y, resolve, reject);
          }, function (error) {
            if (thenCalledOrThrow) {
              return;
            }
            thenCalledOrThrow = true;
            reject(error);
          })
        } else {
          resolve(x);
        }
      } catch (e) {
        if (thenCalledOrThrow) {
          return;
        }
        thenCalledOrThrow = true;
        reject(e);
      }
    } else {
      resolve(x);
    }
  }

  MyPromise.resolve = function (value) {
    if (value instanceof MyPromise) {
      return value;
    } else {
      var promise = new MyPromise(function (resolve, reject) {
        setTimeout(function () {
          resolvePromise(promise, value, resolve, reject);
        })
      });
      return promise;
    }
  }

  MyPromise.reject = function (reason) {
    return new MyPromise(function (resolve, reject) {
      reject(reason);
    })
  }
  
  MyPromise.all = function (promises) {
    return new MyPromise(function (resolve, reject) {
      var count = promises.length;
      var num = 0;
      var result = [];
      for (var i = 0; i < count; i++) { // 闭包解决then正确访问i变量
        (function(i) {
          MyPromise.resolve(promises[i]).then(function (value) {
            num++;
            result[i] = value;
            if (count === num) {
              resolve(result);
            }
          }, function (error) {
            reject(error);
          })
        })(i);
      }
    });
  }

  MyPromise.race = function (promises) {
    return new MyPromise(function (resolve, reject) {
      for (var i = 0; i < promises.length; i++) {
        MyPromise.resolve(promises[i]).then(function (value) {
          resolve(value);
        }, function (error) {
          reject(error);
        })
      }
    });
  }


  return MyPromise;
})();

module.exports = MyPromise;
