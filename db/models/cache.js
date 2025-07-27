"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Cache extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Cache.init(
    {
      key: DataTypes.STRING,
      metadata: DataTypes.JSON,
      expiresAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Cache",
    },
  );
  return Cache;
};
