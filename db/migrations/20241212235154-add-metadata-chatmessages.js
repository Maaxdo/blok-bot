"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.addColumn("ChatMessages", "metadata", {
			type: Sequelize.JSON,
			defaultValue: null,
			allowNull: true,
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.removeColumn("ChatMessages", "metadata");
	},
};
