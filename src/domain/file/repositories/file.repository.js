import File from "../../../models/file.model.js";
import { paginateQuery } from "../../../shared/utils/pagination.js";

class FileRepository {
  async create(data) {
    return await File.create(data);
  }

  async findById(id) {
    return await File.findById(id);
  }

  async findAll({ filters, sort = { createdAt: -1 }, paginator } = {}) {
    return await paginateQuery(File, {
      filters,
      sort,
      paginator,
    });
  }

  async findByStorageKeys(storageKeys = []) {
    if (!storageKeys.length) {
      return [];
    }

    return await File.find({
      storageKey: { $in: storageKeys },
    }).select("storageKey");
  }

  async delete(id) {
    return await File.findByIdAndDelete(id);
  }
}

export default new FileRepository();
