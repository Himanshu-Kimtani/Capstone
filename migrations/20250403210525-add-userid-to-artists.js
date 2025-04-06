"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add userId column to Artists table
    await queryInterface.addColumn("Artists", "userId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // Add isVerified column
    await queryInterface.addColumn("Artists", "isVerified", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });

    // Add socialMedia column (JSON)
    await queryInterface.addColumn("Artists", "socialMedia", {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the columns when rolling back
    await queryInterface.removeColumn("Artists", "userId");
    await queryInterface.removeColumn("Artists", "isVerified");
    await queryInterface.removeColumn("Artists", "socialMedia");
  },
};
