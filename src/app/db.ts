import { Sequelize, DataTypes } from "sequelize";
import { ConfigService } from "../config";

export async function initDb() {
    ConfigService.load();
    const db = new Sequelize(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `mysql://root:${ConfigService.get("db_pwd")}@db:3306/zfc`
    );

    const Theme = db.define("Theme", {
        fsName: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            primaryKey: true,
        },
        dlList: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        dlNum: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        fileSizeKB: {
            type: DataTypes.DECIMAL,
            allowNull: false,
        },
        manifestDl: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        colour: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        imageSrc: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    });

    await Theme.sync();

    return [db, Theme];
}
