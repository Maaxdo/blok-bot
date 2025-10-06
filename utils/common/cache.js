const { Cache } = require("../../db/models");

// Cache expiry time in milliseconds (7 days)
const EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000;

async function cache(key, refetchFunc, expiresAt = EXPIRY_TIME) {
  const savedCache = await Cache.findOne({
    key,
  });

  if (!savedCache) {
    const metadata = await refetchFunc();
    await new Cache({
      key,
      metadata,
      expiresAt: new Date(Date.now() + expiresAt),
    }).save();
    return metadata;
  }

  return savedCache.metadata;
}

async function removeCache(key) {
  await Cache.deleteOne({
    key,
  });
}

module.exports = {
  cache,
  removeCache,
};
