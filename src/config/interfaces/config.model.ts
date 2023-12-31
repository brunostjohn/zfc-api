export interface EnvironmentVariables {
    db_pwd: string;
    gh_token: string;
    app_mode?: string;
}

export type EnvironmentKeys = keyof EnvironmentVariables;

export type RequiredEnvKeys = keyof Omit<EnvironmentVariables, "app_mode">;
