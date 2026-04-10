import User from "../../../models/user.model.js";

class UserRepository {
  async create(data) {
    return await User.create(data);
  }

  async findByUsername(username) {
    return await User.findOne({ username });
  }

  async findById(id) {
    return await User.findById(id);
  }
}

export default new UserRepository();
