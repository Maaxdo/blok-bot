"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ChatMessage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ChatMessage.init(
    {
      userId: DataTypes.INTEGER,
      state: DataTypes.STRING,
      body: DataTypes.TEXT,
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        get() {
          const value = this.getDataValue("metadata");
          return typeof value === "string" ? JSON.parse(value) : value;
        },
      },
    },
    {
      sequelize,
      modelName: "ChatMessage",
    },
  );
  return ChatMessage;
};
