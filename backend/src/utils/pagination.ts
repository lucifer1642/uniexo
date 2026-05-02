import { PaginatedResult, PaginationQuery } from '../types';
import { Model, PopulateOptions } from 'mongoose';

export interface PaginateOptions {
  populate?: PopulateOptions | PopulateOptions[];
  select?: string;
  /** When set, items with rank > 0 appear first (sorted ascending by rank), then unranked items sorted by this field */
  rankSortFallback?: string;
}

export async function paginate<T>(
  model: Model<T>,
  filter: Record<string, unknown>,
  query: PaginationQuery,
  populateOrOptions?: PopulateOptions | PopulateOptions[] | PaginateOptions,
  select?: string,
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 10));

  // Determine options
  let populate: PopulateOptions | PopulateOptions[] | undefined;
  let selectStr = select;
  let rankSortFallback: string | undefined;

  if (populateOrOptions && 'rankSortFallback' in (populateOrOptions as any)) {
    const opts = populateOrOptions as PaginateOptions;
    populate = opts.populate;
    selectStr = selectStr || opts.select;
    rankSortFallback = opts.rankSortFallback;
  } else {
    populate = populateOrOptions as PopulateOptions | PopulateOptions[] | undefined;
  }

  let sort: Record<string, 1 | -1> = {};
  if (rankSortFallback) {
    // Rank-based: ranked items first (rank > 0 asc), then unranked alphabetically
    sort = { rank: -1 as -1, [rankSortFallback]: 1 as 1 };
  } else if (query.sort) {
    sort[query.sort] = query.order === 'desc' ? -1 : 1;
  } else {
    sort['createdAt'] = -1;
  }

  const skip = (page - 1) * limit;

  let dbQuery = model.find(filter as any).sort(sort).skip(skip).limit(limit);

  if (populate) {
    dbQuery = dbQuery.populate(populate);
  }
  if (selectStr) {
    dbQuery = dbQuery.select(selectStr);
  }

  const [data, total] = await Promise.all([
    dbQuery.lean().exec() as Promise<T[]>,
    model.countDocuments({ ...filter, isDeleted: false } as any).exec(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

