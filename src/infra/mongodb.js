import mongoose from "mongoose";
import logger from "../shared/utils/logger.js";
import config from "../config/app.config.js";

let connection = null;

class MongoDB {
  async connect() {
    if (connection) {
      return connection;
    }

    try {
      connection = await mongoose.connect(config.mongodb.uri, {
        dbName: config.mongodb.dbName,
      });

      logger.info("Connected to MongoDB");
      return connection;
    } catch (error) {
      logger.error(`MongoDB connection error: ${error.message}`);
      throw error;
    }
  }

  async close() {
    if (connection) {
      await mongoose.connection.close();
      connection = null;
      logger.info("MongoDB connection closed");
    }
  }
}

export default new MongoDB();
