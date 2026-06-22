const mongoose = require('mongoose');
const mockMongoose = require('./mockMongoose');

const useEmulated = process.env.USE_EMULATED_DB === 'true';

if (useEmulated) {
  module.exports = mockMongoose;
} else {
  module.exports = mongoose;
}
