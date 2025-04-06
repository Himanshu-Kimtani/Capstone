const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MomentLike = sequelize.define(
  "MomentLike",
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
  },
  {
    tableName: "MomentLikes",
    timestamps: true,
    indexes: [
      {
        name: "momentlikes_momentid_index",
        fields: ["momentId"],
      },
      {
        name: "momentlikes_userid_index",
        fields: ["userId"],
      },
      {
        name: "momentlikes_unique",
        unique: true,
        fields: ["momentId", "userId"],
      },
    ],
  }
);

MomentLike.associate = function (models) {
  MomentLike.belongsTo(models.Moment, { foreignKey: "momentId" });
  MomentLike.belongsTo(models.User, { foreignKey: "userId" });
};

module.exports = MomentLike;
