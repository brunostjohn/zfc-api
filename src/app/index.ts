/* eslint-disable no-console */
import express from "express";
import { initDb } from "./db";

const app = express();

let db, theme;

initDb()
    .then(([Db, Theme]) => {
        db = Db;
        theme = Theme;
    })
    .catch((e) => console.log(e));

app.get("/", (req, res) => {
    return res.send("pong");
});

app.get("/featured", (req, res) => {
    return res.send("feat");
});

export default app;
