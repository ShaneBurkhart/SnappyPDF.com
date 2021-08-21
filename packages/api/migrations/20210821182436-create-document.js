'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Documents', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      uuid: {
        allowNull: false,
        unique: true,
        type: Sequelize.UUID,
      },
      filename: {
        type: Sequelize.STRING
      },
      s3Url: {
        allowNull: false,
        type: Sequelize.STRING
      },
      pageCount: {
        type: Sequelize.INTEGER,
      },
      sheetsIndexesCompleted: {
        type: Sequelize.JSONB,
      },
      startedPipelineAt: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Documents');
  }
};