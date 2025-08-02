const { Cache } = require("../../db/models");

const EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000;

async function cache(key, refetchFunc) {
  const savedCache = await Cache.findOne({
    key,
  });

  if (!savedCache) {
    const metadata = await refetchFunc();
    await new Cache({
      key,
      metadata,
      expiresAt: new Date(Date.now() + EXPIRY_TIME),
    }).save();
    return metadata;
  }

  return savedCache.metadata;
}

module.exports = {
  cache,
};
