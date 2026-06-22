const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, '../db_emulated.json');

// Initialize database
let db = {
  users: [],
  quizzes: [],
  quizattempts: [],
  payments: [],
  certificates: []
};

// Load database from file if it exists
const loadDB = () => {
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (err) {
      console.error('Failed to parse emulated database file, starting fresh.');
    }
  }
};

const saveDB = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save emulated database:', err.message);
  }
};

loadDB();

class MockQuery {
  constructor(result, modelName) {
    this.result = JSON.parse(JSON.stringify(result)); // Deep clone
    this.modelName = modelName;
  }

  populate(pathName, selectFields) {
    // Basic populator mock
    const populateSingle = (item) => {
      if (!item) return;
      
      let foreignCollection = '';
      if (pathName === 'userId') foreignCollection = 'users';
      else if (pathName === 'quizId') foreignCollection = 'quizzes';
      else if (pathName === 'quizAttemptId') foreignCollection = 'quizattempts';
      
      if (foreignCollection && item[pathName]) {
        const foreignId = item[pathName].toString();
        const foreignItem = db[foreignCollection].find(f => f._id.toString() === foreignId);
        
        if (foreignItem) {
          let populated = JSON.parse(JSON.stringify(foreignItem));
          if (selectFields) {
            const fields = selectFields.split(' ');
            const filtered = {};
            fields.forEach(f => {
              if (f.startsWith('-')) {
                // exclude
                const cleanF = f.substring(1);
                delete populated[cleanF];
              } else {
                filtered[f] = populated[f];
              }
            });
            if (Object.keys(filtered).length > 0) {
              populated = filtered;
            }
          }
          item[pathName] = populated;
        }
      }
    };

    if (Array.isArray(this.result)) {
      this.result.forEach(populateSingle);
    } else {
      populateSingle(this.result);
    }
    return this;
  }

  sort(criteria) {
    if (!Array.isArray(this.result) || !criteria) return this;
    
    const isDescending = criteria.startsWith('-');
    const field = isDescending ? criteria.substring(1) : criteria;

    this.result.sort((a, b) => {
      let valA = a[field];
      let valB = b[field];
      
      if (field === 'attemptedAt' || field === 'generatedDate' || field === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return isDescending ? 1 : -1;
      if (valA > valB) return isDescending ? -1 : 1;
      return 0;
    });

    return this;
  }

  limit(count) {
    if (Array.isArray(this.result)) {
      this.result = this.result.slice(0, count);
    }
    return this;
  }

  select(fields) {
    if (!fields) return this;
    const filterSingle = (item) => {
      if (!item) return;
      const fieldList = fields.split(' ');
      const hasExclusions = fieldList.some(f => f.startsWith('-'));
      const hasInclusions = fieldList.some(f => !f.startsWith('-') && f !== '+password');
      
      if (hasExclusions) {
        fieldList.forEach(f => {
          if (f.startsWith('-')) {
            delete item[f.substring(1)];
          }
        });
      } else if (hasInclusions) {
        const filtered = { _id: item._id };
        fieldList.forEach(f => {
          if (f === '+password') {
            // Keep password if explicitly requested
            filtered.password = item.password;
          } else {
            filtered[f] = item[f];
          }
        });
        // Mutate original item fields
        Object.keys(item).forEach(key => {
          if (key !== '_id' && !filtered.hasOwnProperty(key)) {
            delete item[key];
          }
        });
        Object.assign(item, filtered);
      }

      // Hide password by default unless explicitly asked for via +password
      if (!fields.includes('+password')) {
        delete item.password;
      }
    };

    if (Array.isArray(this.result)) {
      this.result.forEach(filterSingle);
    } else {
      filterSingle(this.result);
    }
    return this;
  }

  // Thenable interface to allow async/await
  then(onResolve) {
    return Promise.resolve(onResolve ? onResolve(this.result) : this.result);
  }
}

// Mock Mongoose Model Class Creator
const createModel = (modelName, schema) => {
  let collectionName = modelName.toLowerCase() + 's';
  if (collectionName === 'quizs') collectionName = 'quizzes';
  if (!db[collectionName]) {
    db[collectionName] = [];
    saveDB();
  }
  
  class Model {
    constructor(data) {
      Object.assign(this, data);
      if (!this._id) {
        this._id = new mongoose.Types.ObjectId().toString();
      }
    }

    async save() {
      // Handle password pre-save hook for User
      if (modelName === 'User' && this.password && !this.password.startsWith('$2a$')) {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      }

      const collection = db[collectionName];
      const existingIdx = collection.findIndex(item => item._id.toString() === this._id.toString());
      
      const doc = JSON.parse(JSON.stringify(this));

      if (existingIdx !== -1) {
        collection[existingIdx] = doc;
      } else {
        if (!doc.createdAt && modelName === 'User') doc.createdAt = new Date().toISOString();
        if (!doc.attemptedAt && modelName === 'QuizAttempt') doc.attemptedAt = new Date().toISOString();
        if (!doc.createdAt && modelName === 'Payment') doc.createdAt = new Date().toISOString();
        if (!doc.generatedDate && modelName === 'Certificate') doc.generatedDate = new Date().toISOString();
        collection.push(doc);
      }
      
      saveDB();
      return this;
    }

    // Methods
    async matchPassword(enteredPassword) {
      const bcrypt = require('bcryptjs');
      // Look up password from database matching this user ID
      const user = db.users.find(u => u._id.toString() === this._id.toString());
      if (!user) return false;
      return await bcrypt.compare(enteredPassword, user.password);
    }

    async deleteOne() {
      const collection = db[collectionName];
      db[collectionName] = collection.filter(item => item._id.toString() !== this._id.toString());
      saveDB();
      return { deletedCount: 1 };
    }

    // Static DB methods
    static find(query = {}) {
      let results = db[collectionName];
      
      // Match query filters
      if (Object.keys(query).length > 0) {
        results = results.filter(item => {
          return Object.keys(query).every(key => {
            if (query[key] === undefined) return true;
            return item[key]?.toString() === query[key]?.toString();
          });
        });
      }

      return new MockQuery(results, modelName);
    }

    static findOne(query = {}) {
      let results = db[collectionName];
      
      const matched = results.find(item => {
        return Object.keys(query).every(key => {
          if (query[key] === undefined) return true;
          return item[key]?.toString() === query[key]?.toString();
        });
      });

      return new MockQuery(matched || null, modelName);
    }

    static findById(id) {
      if (!id) return new MockQuery(null, modelName);
      const results = db[collectionName];
      const matched = results.find(item => item._id.toString() === id.toString());
      
      if (matched) {
        // Return an instance with matchPassword capabilities
        const instance = new Model(matched);
        return new MockQuery(instance, modelName);
      }
      return new MockQuery(null, modelName);
    }

    static async create(data) {
      let instances = [];
      if (Array.isArray(data)) {
        for (const item of data) {
          const inst = new Model(item);
          await inst.save();
          instances.push(inst);
        }
        return instances;
      } else {
        const inst = new Model(data);
        await inst.save();
        return inst;
      }
    }

    static async insertMany(array) {
      return this.create(array);
    }

    static async findByIdAndUpdate(id, updateData, options = {}) {
      const collection = db[collectionName];
      const idx = collection.findIndex(item => item._id.toString() === id.toString());
      if (idx === -1) return null;

      // Extract options like $push or direct assignments
      const original = collection[idx];
      const updated = { ...original, ...updateData };
      
      collection[idx] = updated;
      saveDB();
      return new Model(updated);
    }

    static async countDocuments(query = {}) {
      const q = this.find(query);
      const res = await q;
      return res.length;
    }
  }

  return Model;
};

class Schema {
  constructor(definition) {
    this.definition = definition;
    this.methods = {};
  }
  pre(event, fn) {
    // no-op
  }
}
Schema.Types = {
  ObjectId: class {
    toString() { return 'ObjectId'; }
  }
};

// Main Mock Mongoose object
const mongoose = {
  Schema: Schema,
  model: function(name, schema) {
    return createModel(name, schema);
  },
  Types: {
    ObjectId: class {
      constructor(id) {
        this.id = id || crypto.randomBytes(12).toString('hex');
      }
      toString() {
        return this.id;
      }
    }
  },
  connect: async () => {
    console.log('[SYSTEM INFO] EMULATED DATABASE ACTIVE: Writing queries to backend/db_emulated.json');
    return { connection: { host: 'JSON-Emulated-Host' } };
  }
};

module.exports = mongoose;
