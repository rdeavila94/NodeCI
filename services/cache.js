const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisURI);

//This is a reference to the original exec function
const exec = mongoose.Query.prototype.exec;
client.hget = util.promisify(client.hget);

mongoose.Query.prototype.exec = async function () {

  if (!this._cache) {
    return exec.apply(this, arguments);
  }
  const key = JSON.stringify(Object.assign({}, this.getQuery(), {
    collection: this.mongooseCollection.name
  }));

  //See if we have a value for 'key' in redis
  const val = await client.hget(this._hashKey, key);

  //if we do return that
  if (val) {
    const doc = JSON.parse(val);

    return Array.isArray(doc) ? doc.map(d => new this.model(d)) : new this.model(doc);
  } else {
    const returnVal = await exec.apply(this, arguments);
    client.hset(this._hashKey, key, JSON.stringify(returnVal), 'EX', 30);
    return returnVal;
  }
};

mongoose.Query.prototype.cache = async function (options = {}) {
  this._cache = true;
  this._hashKey = JSON.stringify(options.key || '');

  return this;
};

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
};