
/**
 * Test.
 */

var assert = require('assert');

var level = require('level');
var sublevel = require('sublevel');
var indexing = require('../')

var dbpath = __dirname + '/level-test';
var top;
var db;

beforeEach(function(done){
  top = level(dbpath, done);
  db = sublevel(top, { valueEncoding: 'json' });
})

afterEach(function(done){
  top.close(function(){
    level.destroy(dbpath, done);
  });
})

describe("indexing(db)", function(){

  it("should patch db", function(){
    var indexed = indexing(db);
    indexed.should.have.property('index');
    indexed.should.have.property('indexes');
    indexed.should.have.property('getBy');
    indexed.should.have.property('by');
    indexed.should.have.property('find');
  })

})

describe("index(name)", function(){

  it("should create an index", function(){
    var indexed = indexing(db);
    indexed.index('username');
    indexed.indexes.should.contain('username');
  })

  it("should patch put to write in the index", function(done){
    var indexed = indexing(db);
    indexed.index('username');
    indexed.put(1, { username: 'foobar' }, function(err){
      top.get('/username/foobar', function(err, value){
        assert(null == err);
        value.should.equal('1');
        done();
      });
    });
  })

  it("should patch del to also remove the index", function(done){
    var indexed = indexing(db);
    indexed.index('username');
    indexed.put(1, { username: 'foobar' }, function(err){
      top.get('/username/foobar', function(err, value){
        assert(null == err);
        value.should.equal('1');
        indexed.del(1, function(err){
          assert(null == err);
          top.get('/username/foobar', function(err, value){
            assert(err);
            assert('NotFoundError' == err.type);
            assert(null == value);
            indexed.get(1, function(err, value){
              assert(err);
              assert('NotFoundError' == err.type);
              assert(null == value);
              done();
            });
          });
        });
      });
    });
  })

  it("should write multiple indexes", function(done){
    var indexed = indexing(db);
    indexed
    .index('username')
    .index('email');
    indexed.indexes.should.contain('username');
    indexed.indexes.should.contain('email');
    indexed.put(1, {
      username: 'foobar',
      email: 'foo@bar'
    }, function(err){
      top.get('/username/foobar', function(err, value){
        assert(null == err);
        value.should.equal('1');
        top.get('/email/foo@bar', function(err, value){
          assert(null == err);
          value.should.equal('1');
          done();
        });
      });
    });
  })

})

describe("by(index, key, fn)", function(){

  it("should get value by index", function(done){
    var indexed = indexing(db);
    indexed.index('username');
    indexed.put(1, { username: 'foobar'}, function(err){
      indexed.by('username', 'foobar', function(err, value){
        assert(null == err);
        value.should.eql({ username: 'foobar' });
        done();
      });
    });
  })

  it("should get value by index when passed an object", function(done){
    var indexed = indexing(db);
    indexed.index('username');
    indexed.put(1, { username: 'foobar'}, function(err){
      indexed.by('username', { username: 'foobar' }, function(err, value){
        assert(null == err);
        value.should.eql({ username: 'foobar' });
        done();
      });
    });
  })

  it("should return an error when index not found", function(done){
    var indexed = indexing(db);
    indexed.index('username');
    indexed.put(1, { username: 'foobar'}, function(err){
      indexed.by('username', 'foo', function(err, value){
        assert(err);
        assert('NotIndexedError' == err.type);
        assert(null == value);
        done();
      });
    });
  })

  it("should work with alias getBy", function(done){
    var indexed = indexing(db);
    indexed.index('username');
    indexed.put(1, { username: 'foobar'}, function(err){
      indexed.getBy('username', 'foobar', function(err, value){
        assert(null == err);
        value.should.eql({ username: 'foobar' });
        done();
      });
    });
  })

  it("should work with alias byIndexname", function(done){
    var indexed = indexing(db);
    indexed.index('username');
    indexed.put(1, { username: 'foobar'}, function(err){
      indexed.byUsername('foobar', function(err, value){
        assert(null == err);
        value.should.eql({ username: 'foobar' });
        done();
      });
    });
  })

  it("should work with alias getByIndexname", function(done){
    var indexed = indexing(db);
    indexed.index('username');
    indexed.put(1, { username: 'foobar'}, function(err){
      indexed.getByUsername('foobar', function(err, value){
        assert(null == err);
        value.should.eql({ username: 'foobar' });
        done();
      });
    });
  })

})

describe("find(key, fn)", function(){

  it("should find value in indexes", function(done){
    var indexed = indexing(db);
    indexed
    .index('username')
    .index('email');
    indexed.put(1, {
      username: 'foobar',
      email: 'foo@bar'
    }, function(err){
      indexed.find('foobar', function(err, value){
        assert(null == err);
        value.should.eql({
          username: 'foobar',
          email: 'foo@bar'
        });
        done();
      });
    });
  })

  it("should find value in indexes when passed an object", function(done){
    var indexed = indexing(db);
    indexed
    .index('username')
    .index('email');
    indexed.put(1, {
      username: 'foobar',
      email: 'foo@bar'
    }, function(err){
      indexed.find({ email: 'foo@bar' }, function(err, value){
        assert(null == err);
        value.should.eql({
          username: 'foobar',
          email: 'foo@bar'
        });
        done();
      });
    });
  })

  it("should first check for the actual key", function(done){
    var indexed = indexing(db);
    indexed
    .index('username')
    .index('email');
    indexed.put(1, {
      username: 'foobar',
      email: 'foo@bar'
    }, function(err){
      indexed.find(1, function(err, value){
        assert(null == err);
        value.should.eql({
          username: 'foobar',
          email: 'foo@bar'
        });
        done();
      });
    });
  })

  it("should return an error when index not found", function(done){
    var indexed = indexing(db);
    indexed
    .index('username')
    .index('email');
    indexed.put(1, {
      username: 'foobar',
      email: 'foo@bar'
    }, function(err){
      indexed.find('blah', function(err, value){
        assert(err);
        assert('NotIndexedError' == err.type);
        assert(null == value);
        done();
      });
    });
  })

})
