"use strict"

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const toInteger = (value, fallback) => {
  const numeric = Number.parseInt(value, 10);
  return Number.isNaN(numeric) ? fallback : numeric;
};

const normalizeSortDirection = (direction) => {
  if ([1, "1", "asc", "ascending"].includes(direction)) {
    return 1;
  }

  if ([-1, "-1", "desc", "descending"].includes(direction)) {
    return -1;
  }

  return undefined;
};

const fromSortTuples = (sortTuples) => {
  if (!Array.isArray(sortTuples) || !sortTuples.length) {
    return undefined;
  }

  const normalized = sortTuples.reduce((acc, tuple) => {
    if (!Array.isArray(tuple) || tuple.length < 2) {
      return acc;
    }

    const [field, direction] = tuple;
    const normalizedDirection = normalizeSortDirection(direction);

    if (typeof field === "string" && field && normalizedDirection) {
      acc[field] = normalizedDirection;
    }

    return acc;
  }, {});

  return Object.keys(normalized).length ? normalized : undefined;
};

export const normalizeSort = (sort) => {
  if (!sort) {
    return undefined;
  }

  if (typeof sort === "string") {
    const clauses = sort
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!clauses.length) {
      return undefined;
    }

    return clauses.reduce((acc, clause) => {
      const direction = clause.startsWith("-") ? -1 : 1;
      const field = clause.replace(/^-/, "");

      if (field) {
        acc[field] = direction;
      }

      return acc;
    }, {});
  }

  if (Array.isArray(sort)) {
    return fromSortTuples(sort);
  }

  if (typeof sort === "object") {
    const normalized = Object.entries(sort).reduce((acc, [field, direction]) => {
      const normalizedDirection = normalizeSortDirection(direction);

      if (normalizedDirection) {
        acc[field] = normalizedDirection;
      }

      return acc;
    }, {});

    return Object.keys(normalized).length ? normalized : undefined;
  }

  return undefined;
};

export const normalizeFilters = (filters) => {
  if (!filters) {
    return [];
  }

  if (Array.isArray(filters)) {
    return filters.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        Object.keys(item).length
    );
  }

  if (typeof filters === "object" && Object.keys(filters).length) {
    return [filters];
  }

  return [];
};

export const buildFilterQuery = (filters) => {
  const normalizedFilters = normalizeFilters(filters);

  if (normalizedFilters.length === 1) {
    return normalizedFilters[0];
  }

  if (normalizedFilters.length > 1) {
    return { $and: normalizedFilters };
  }

  return {};
};

export const buildPaginator = (paginator = {}) => {
  const page = Math.max(toInteger(paginator.page, DEFAULT_PAGE), 1);
  const limit = Math.max(toInteger(paginator.limit, DEFAULT_LIMIT), 1);
  const boundedLimit = Math.min(limit, paginator.maxLimit || MAX_LIMIT);

  return {
    page,
    limit: boundedLimit,
    skip: (page - 1) * boundedLimit,
  };
};

/**
 * Build MongoDB query + find options for Mongoose `Model.find(...)`.
 *
 * Supported sort inputs:
 * - object: { createdAt: -1, name: "asc" }
 * - string: "-createdAt,name"
 * - tuples: [["createdAt", -1], ["name", "asc"]]
 *
 * Return format: [query, projection, options]
 */
export const buildFindQueryOptions = ({
  filters,
  sort,
  paginator,
  projection,
} = {}) => {
  const query = buildFilterQuery(filters);
  const normalizedSort = normalizeSort(sort);
  const { skip, limit } = buildPaginator(paginator);

  const options = {
    skip,
    limit,
    ...(normalizedSort ? { sort: normalizedSort } : {}),
  };

  return [query, projection ?? null, options];
};

export default buildFindQueryOptions;
