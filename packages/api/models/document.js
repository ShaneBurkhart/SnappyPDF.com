'use strict';
const uuid = require("uuid").v4;

module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
    uuid: {
      allowNull: false, 
      type: DataTypes.UUID,
    },
    s3Url: {
      allowNull: false, 
      type: DataTypes.STRING,
    },
    filename: DataTypes.STRING,
    pageCount: DataTypes.INTEGER,
    sheetsIndexesCompleted: DataTypes.JSONB,
    startedPipelineAt: DataTypes.DATE
  }, {});
  Document.associate = function(models) {
    // associations can be defined here
  };

  Document.beforeValidate(doc => {
    doc.uuid = uuid()
  });

  return Document;
};