import express from "express";
import { Sequelize } from "sequelize";

// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
const db = new Sequelize(`mysql://root:${process.env.MYSQL_PWD}@db:3306/zfc`);

const app = express();

app.get("/", (req, res) => {
    return res.send("pong");
});

export default app;
