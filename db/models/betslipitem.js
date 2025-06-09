"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class BetSlipItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }
  BetSlipItem.init(
    {
      sportKey: DataTypes.STRING,
      sportTitle: DataTypes.STRING,
      commenceTime: DataTypes.STRING,
      homeTeam: DataTypes.STRING,
      awayTeam: DataTypes.STRING,
      eventId: DataTypes.STRING,
      outcome: {
        type: DataTypes.JSON,
        allowNull: false,
        get() {
          const value = this.getDataValue("outcome");
          return typeof value === "string" ? JSON.parse(value) : value;
        },
      },
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "BetSlipItem",
    },
  );
  return BetSlipItem;
};
