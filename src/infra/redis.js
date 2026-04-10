import Redis from "ioredis";
import logger from "../shared/utils/logger.js";

let redis = null;

export const getRedis = () => {
    if (!redis) {
        let redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
            logger.warn("REDIS_URL not set, falling back to memory mock for skeleton");
            // Just returning a mock or setup error handling
            // In a real scenario, this would initialize ioredis
            // redis = new Redis(process.env.REDIS_URL)
            return null;
        } else {
            redis = new Redis(redisUrl);
        }
    }
    return redis;
};
