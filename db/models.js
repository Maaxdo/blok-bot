const mongoose = require("mongoose");

const UserSchema = mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    state: {
      type: String,
      default: null,
    },
    metadata: {
      type: Object,
      default: {},
    },
    rememberedState: {
      type: String,
      default: null,
    },
    expiryCommand: {
      type: String,
      default: null,
    },
    expiryCommandDatetime: {
      type: Date,
      default: null,
    },
    hasVerifiedKyc: {
      type: Boolean,
      default: false,
    },
    hasWallet: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
const CacheSchema = mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  metadata: {
    type: Object,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    expires: 0,
    required: true,
  },
});
const User = mongoose.model("User", UserSchema);
const Cache = mongoose.model("Cache", CacheSchema);

module.exports = { User, Cache };
