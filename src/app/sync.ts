/* eslint-disable */
// @ts-nocheck

import { getAllThemes, getMasterManifest } from "./ghApi";

export async function syncFeatured() {
    const manifest = (await getMasterManifest()) as { featured: string[] };

    return manifest;
}

export async function syncThemes(table) {
    const allThemes = await getAllThemes();

    for (const theme of allThemes) {
        const possibleEntry = await table.findByPk(theme.fs_name);
        if (possibleEntry === null) {
            await table.create({
                fsName: theme.fs_name,
                dlList: JSON.stringify(theme.dlList),
                dlNum: 0,
                fileSizeKB: theme.fileSizeKB,
                manifestDl: theme.manifestDl,
                colour: theme.colour,
                imageSrc: theme.image_src,
            });
        } else {
            const keys = Object.keys(theme);

            for (const key of keys) {
                if (
                    possibleEntry.dataValues[key] !== theme[key] &&
                    typeof theme[key] !== "object" &&
                    key !== "dlNum"
                ) {
                    await table.update(
                        { [key]: theme[key] },
                        { where: { fsName: theme.fs_name } }
                    );
                } else if (typeof theme[key] === "object") {
                    if (
                        possibleEntry.dataValues[key] !==
                        JSON.stringify(theme[key])
                    ) {
                        await table.update(
                            { [key]: JSON.stringify(theme[key]) },
                            { where: { fsName: theme.fs_name } }
                        );
                    }
                }
            }
        }
    }
}
