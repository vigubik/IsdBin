var expect = require("chai").expect;
var all = require('./all.js');

describe('combineExecutionArgs', function () {
   it('combines', function() {
      var combined = all.combineExecutionArgs(['initial'], {key: function(arg) { return arg; } }, 'key', ['arg']);
      expect(combined).to.deep.equal(['initial','arg']);
   });
})