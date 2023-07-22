// import { getColorFromURL } from "color-thief-node";
import fetch from "node-fetch";
import { ConfigService } from "../config";

export interface Theme {
    fs_name: string;
    image_src: string;
    colour: string;
    dlList: DownloadItem[];
    fileSizeKB: number;
    manifestDl: string;
    dlNum: number;
}

export interface DownloadItem {
    ghPath: string;
    dlLink: string;
}

export interface Manifest {
    featured: string[];
}

export const getAllThemes = async (truncateAfter = 0) => {
    const allThemes = (await getDirContents("Themes")) as { name: string }[];

    const themes = [];
    let counter = 0;

    for (const theme of allThemes) {
        const result = await fetchAndParseTheme(theme.name);
        themes.push(result);
        if (truncateAfter > 0) {
            counter++;

            if (counter >= truncateAfter) {
                break;
            }
        }
    }

    return themes;
};

export const getFeaturedThemes = async () => {
    const manifest = await getMasterManifest();

    const featuredThemes = [];

    for (const featuredTheme of manifest.featured) {
        const theme = await fetchAndParseTheme(featuredTheme);
        featuredThemes.push(theme);
    }

    return featuredThemes;
};

export const getMasterManifest = async (): Promise<Manifest> => {
    ConfigService.load();
    const restEndpoint = `https://api.github.com/repos/brunostjohn/zefirs-flashy-cooler-themes/contents/manifest.json`;

    const response = await fetch(restEndpoint, {
        headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            Authorization: `Bearer ${ConfigService.get("gh_token")}`,
        },
    });

    const parsedObject = (await response.json()) as {
        download_url: string;
    };

    const manifestFile = await fetch(parsedObject.download_url);
    const manifest = (await manifestFile.json()) as Manifest;

    return manifest;
};

export const getDirContents = async (dirPath = "") => {
    ConfigService.load();
    const restEndpoint = `https://api.github.com/repos/brunostjohn/zefirs-flashy-cooler-themes/contents/${encodeURIComponent(
        dirPath
    )}`;

    const response = await fetch(restEndpoint, {
        headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            Authorization: `Bearer ${ConfigService.get("gh_token")}`,
        },
    });

    const parsedObject = await response.json();

    return parsedObject;
};

export const fetchAndParseTheme = async (themePath: string): Promise<Theme> => {
    ConfigService.load();
    const restEndpoint = `https://api.github.com/repos/brunostjohn/zefirs-flashy-cooler-themes/contents/Themes/${encodeURIComponent(
        themePath
    )}`;

    const response = await fetch(restEndpoint, {
        headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            Authorization: `Bearer ${ConfigService.get("gh_token")}`,
        },
    });

    const parsedObject = (await response.json()) as {
        download_url: string;
        name: string;
        type: "file" | "dir";
        path: string;
        size: number;
        url: string;
    }[];

    const recursiveDlList = async (
        parsedObject: {
            download_url: string;
            name: string;
            type: "file" | "dir";
            path: string;
            size: number;
            url: string;
        }[],
        { fileSizeBytes, dlList } = {
            fileSizeBytes: 0,
            dlList: [] as DownloadItem[],
        }
    ) => {
        if (typeof parsedObject[Symbol.iterator] === "function") {
            for (const parsed of parsedObject) {
                if (parsed.type === "file") {
                    dlList.push({
                        ghPath: parsed.path,
                        dlLink: parsed.download_url,
                    });
                    fileSizeBytes += parsed.size;
                } else if (parsed.type === "dir") {
                    const response = await fetch(parsed.url, {
                        headers: {
                            Accept: "application/vnd.github+json",
                            "X-GitHub-Api-Version": "2022-11-28",
                            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                            Authorization: `Bearer ${ConfigService.get(
                                "gh_token"
                            )}`,
                        },
                    });

                    const parsedObject = (await response.json()) as {
                        download_url: string;
                        name: string;
                        type: "file" | "dir";
                        path: string;
                        size: number;
                        url: string;
                    }[];

                    const returned = await recursiveDlList(parsedObject, {
                        fileSizeBytes,
                        dlList,
                    });
                    fileSizeBytes += returned.fileSizeBytes;
                    dlList.push(...returned.dlList);
                }
            }
        } else {
            const parsed = parsedObject as unknown as {
                download_url: string;
                name: string;
                type: "file" | "dir";
                path: string;
                size: number;
                url: string;
            };
            if (parsed.type === "file") {
                dlList.push({
                    ghPath: parsed.path,
                    dlLink: parsed.download_url,
                });
                fileSizeBytes += parsed.size;
            }
        }
        return { fileSizeBytes, dlList };
    };

    const { fileSizeBytes, dlList } = await recursiveDlList(parsedObject);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const image_src = parsedObject.find(
        (file: { name: string }) => file.name === "preview.jpg"
    )!.download_url;

    // const colours = await getColorFromURL(image_src);
    // const colour = "#000000";

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const manifestUrl = parsedObject.find(
        (file: { name: string }) => file.name === "theme.json"
    )!.download_url;

    const themeObject: Theme = {
        fs_name: themePath,
        image_src,
        // colour: `#${colours[0].toString(16)}${colours[1].toString(
        //     16
        // )}${colours[2].toString(16)}`,
        colour: "#000000",
        manifestDl: manifestUrl,
        dlList,
        dlNum: 0,
        fileSizeKB: fileSizeBytes / 1024,
    };

    return themeObject;
};
