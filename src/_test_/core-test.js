// 执行promises-aplus-tests测试, 请先执行npm i -g promises-aplus-tests

var MyPromise = require('../core');

MyPromise.deferred = function() {
  let defer = {};
  defer.promise = new MyPromise((resolve, reject) => {
    defer.resolve = resolve;
    defer.reject = reject;
});
  return defer;
}
try {
  module.exports = MyPromise
} catch (e) {}
