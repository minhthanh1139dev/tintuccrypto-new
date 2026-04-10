import LocalStorage from "./local.storage.js";
import S3Storage from "./s3.storage.js";

const providers = {
    local: LocalStorage,
    s3: S3Storage,
    r2: S3Storage
};

const type = process.env.STORAGE_PROVIDER || "local";
const ProviderClass = providers[type] || providers.local;

export default new ProviderClass();
