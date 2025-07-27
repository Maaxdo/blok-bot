const { Cache } = require("../../db/models");

const EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000;

async function cache(key, refetchFunc) {
  const savedCache = await Cache.findOne({
    where: {
      key,
    },
  });

  if (!savedCache) {
    const metadata = await refetchFunc();
    await Cache.create({
      key,
      metadata,
      expiresAt: new Date(Date.now() + EXPIRY_TIME),
    });
    return metadata;
  }

  if (savedCache.expiresAt >= new Date()) {
    return JSON.parse(savedCache.metadata);
  }
  const newMetadata = await refetchFunc();
  savedCache.metadata = newMetadata;
  savedCache.expiresAt = new Date(Date.now() + EXPIRY_TIME);
  await savedCache.save();
  return newMetadata;
}

module.exports = {
  cache,
};
