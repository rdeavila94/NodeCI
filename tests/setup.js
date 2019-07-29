jest.setTimeout(15000);

require('../models/User');

const mongoose = require('mongoose');
const keys = require('../config/keys');

mongoose.Promise = global.Promise;//Mongo doesn't know what promise implementation to use. This is telling mongo to use the default Node promise implementation
mongoose.connect(keys.mongoURI, { useMongoClient: true });