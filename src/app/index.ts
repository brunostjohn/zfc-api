/* eslint-disable no-console */
import express from "express";
import { initDb } from "./db";
import { syncFeatured, syncThemes } from "./sync";
import { Sequelize, ModelCtor, Model } from "sequelize";
import { DownloadItem, Theme } from "./ghApi";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import cors from "cors";

const app = express();
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
app.use(cors());

let db, themes: Sequelize | ModelCtor<Model<any, any>>, featured: string[];

let isThemeSyncDone = false;

initDb()
    .then(([Db, Themes]) => {
        db = Db;
        themes = Themes;
        syncThemes(themes)
            .then(() => (isThemeSyncDone = true))
            .catch((e) => console.log(e));
    })
    .catch((e) => console.log(e));

setInterval(() => {
    syncThemes(themes)
        .then(() => (isThemeSyncDone = true))
        .catch((e) => console.log(e));
}, 1000 * 60 * 60);

syncFeatured()
    .then((manifest) => (featured = manifest.featured))
    .catch((e) => console.log(e));

async function getTheme(theme_id: string): Promise<Theme> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const theme = (await themes.findByPk(theme_id)) as {
        dataValues: {
            fsName: string;
            dlList: string;
            dlNum: number;
            fileSizeKB: number;
            manifestDl: string;
            colour: string;
            imageSrc: string;
        };
    };
    if (theme === null) {
        throw new Error("Theme does not exist!");
    }

    return {
        fs_name: theme.dataValues.fsName,
        dlList: JSON.parse(theme.dataValues.dlList) as DownloadItem[],
        dlNum: theme.dataValues.dlNum,
        fileSizeKB: theme.dataValues.fileSizeKB,
        manifestDl: theme.dataValues.manifestDl,
        colour: theme.dataValues.colour,
        image_src: theme.dataValues.imageSrc,
    };
}

app.get("/", (req, res) => {
    return res.send("pong");
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.get("/featured", async (req, res) => {
    const themes = [];
    for (const theme of featured) {
        themes.push(await getTheme(theme));
    }
    return res.send(themes);
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.get("/theme/:fsName", async (req, res) => {
    try {
        const theme = await getTheme(req.params.fsName);
        return res.send(theme);
    } catch {
        return res.send({});
    }
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.get("/theme/counts/:fsName/fetch/", async (req, res) => {
    const theme = await getTheme(req.params.fsName);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await themes.update(
        { dlNum: theme.dlNum + 1 },
        { where: { fsName: theme.fs_name } }
    );
    return res.send("done");
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.get("/themes/:page", async (req, res) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const themesAllDb = (await themes.findAll()) as {
        dataValues: {
            fsName: string;
            dlList: string;
            dlNum: number;
            fileSizeKB: number;
            manifestDl: string;
            colour: string;
            imageSrc: string;
        };
    }[];
    const i = parseInt(req.params.page);
    const chunked = themesAllDb.slice(i, i + 20);
    const themesAll = chunked.map((theme) => {
        return {
            fs_name: theme.dataValues.fsName,
            dlList: JSON.parse(theme.dataValues.dlList) as DownloadItem[],
            dlNum: theme.dataValues.dlNum,
            fileSizeKB: theme.dataValues.fileSizeKB,
            manifestDl: theme.dataValues.manifestDl,
            colour: theme.dataValues.colour,
            image_src: theme.dataValues.imageSrc,
        };
    });
    return res.send(themesAll);
});

export default app;
