"use strict"

import { buildFindQueryOptions, buildPaginator } from "./queryOptions.js";

/**
 * Thực thi query phân trang hoàn chỉnh cho Mongoose Model.
 * Chạy song song 2 promises để lấy data và đếm tổng số document.
 * 
 * @param {import('mongoose').Model} model - Mongoose Model
 * @param {Object} options 
 * @param {Object} options.filters - Điều kiện query (VD: { status: "active" })
 * @param {Object|string} options.sort - Điều kiện sắp xếp (VD: { createdAt: -1 } hoặc "-createdAt")
 * @param {Object} options.paginator - Object phân trang (VD: { page: 1, limit: 20 })
 * @param {String|Object} options.projection - Các trường cần lấy (VD: "-password")
 * @param {Array|String} options.populate - Dữ liệu cần populate
 * @returns {Promise<{ items: any[], total: number, page: number, limit: number }>}
 */
export const paginateQuery = async (model, { filters, sort, paginator, projection, populate } = {}) => {
  const [query, proj, options] = buildFindQueryOptions({ filters, sort, paginator, projection });
  const { page, limit } = buildPaginator(paginator);
  
  const findQuery = model.find(query, proj, options);
  if (populate) {
    findQuery.populate(populate);
  }

  const [items, total] = await Promise.all([
    findQuery.lean().exec(),
    model.countDocuments(query).exec()
  ]);
  
  return { items, total, page, limit };
};

export default paginateQuery;
