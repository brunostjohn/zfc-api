import {
    EnvironmentVariables,
    RequiredEnvKeys,
    EnvironmentKeys,
} from "../interfaces/config.model";

export class ConfigService {
    private static config: Partial<EnvironmentVariables> = {};
    private static required: RequiredEnvKeys[] = ["db_pwd", "gh_token"];

    private static validate() {
        const errors: string[] = [];

        ConfigService.required.forEach((x) => {
            if (!ConfigService.config[x]) {
                errors.push(x);
            }
        });

        return errors;
    }

    static load() {
        ConfigService.config.db_pwd = process.env.DB_PWD;
        ConfigService.config.gh_token = process.env.GH_TOKEN;
        ConfigService.config.app_mode = process.env.APP_MODE;

        const errors = ConfigService.validate();
        if (errors.length) {
            throw new Error(
                `Invalid App configuration, missing values for ${errors.join(
                    ","
                )}`
            );
        }
    }

    static get<T>(key: EnvironmentKeys) {
        return ConfigService.config[key] as T;
    }
}
