"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("BetSlipItems", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      sportKey: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sportTitle: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      commenceTime: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      homeTeam: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      awayTeam: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      outcome: {
        type: Sequelize.JSON,
        allowNull: false,
      },

      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("BetSlipItems");
  },
};
