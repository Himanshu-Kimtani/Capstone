const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MomentComment = sequelize.define(
  "MomentComment",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    momentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Moments",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isReported: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "MomentComments",
    timestamps: true,
    indexes: [
      {
        name: "momentcomments_momentid_index",
        fields: ["momentId"],
      },
      {
        name: "momentcomments_userid_index",
        fields: ["userId"],
      },
    ],
  }
);

MomentComment.associate = function (models) {
  MomentComment.belongsTo(models.Moment, { foreignKey: "momentId" });
  MomentComment.belongsTo(models.User, { foreignKey: "userId" });
};

module.exports = MomentComment;
