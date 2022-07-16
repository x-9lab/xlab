import path from "path";

interface IEnvData {
    /**环境名称 */
    env: string;

    /**是否为生产环境 */
    isProd: boolean;

    /**环境配置文件地址 */
    envAddConfPath: string;
}

/**环境名称 */
var env: string;
/**是否为生产环境 */
var isProd: boolean;
/**环境配置文件地址 */
var envAddConfPath: string;

function getEnv(argv: Record<string, string>) {
    return (argv.ENV !== undefined ? argv.ENV
        : process.env && process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase()
        || "development"
    );
}

export default (argv: Record<string, string>) => {
    switch (getEnv(argv)) {
        case "0":
            env = "DEVELOPMENT";
            isProd = false;
            envAddConfPath = path.join("@config", "config.dev");
            break;
        case "1":
            env = "PRODUCTION";
            isProd = true;
            break;

        case "2":
            env = "SANDBOX";
            isProd = false;
            envAddConfPath = path.join("@config", "config.sand");
            break;

        case "development":
            env = "DEVELOPMENT";
            isProd = false;
            envAddConfPath = path.join("@config", "config.dev");
            break;

        case "sandbox":
            env = "SANDBOX";
            isProd = false;
            envAddConfPath = path.join("@config", "config.sand");
            break;

        case "production":
            env = "PRODUCTION";
            isProd = true;
            break;

        default:
            env = "DEVELOPMENT";
            isProd = false;
            envAddConfPath = path.join("@config", "config.dev");

    }

    return <IEnvData>{
        env
        , isProd
        , envAddConfPath
    }
}

