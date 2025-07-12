import { BaseQueryObject, ComparisonObjectDefinition } from './types';

export type GenerateQueryProps = {
  sqlString: string;
  filter: BaseQueryObject & { [field: string]: number | string | boolean | null | ComparisonObjectDefinition };
  prefixMap?: Record<string, string>;
}

const operatorMap: Record<string, string> = {
  $gt: '>',
  $lt: '<',
  $gte: '>=',
  $lte: '<=',
  $ne: '!=',
};

const nonFilters: Record<string, boolean> = {
  $limit: true,
  $skip: true,
  $sort: true,
};

const getPrefix = (field: string, prefixMap: Record<string, string>): string => 
  prefixMap[field]
    ? `${prefixMap[field]}.`
    : '';

export const generateSqlAndParams = (props: GenerateQueryProps): { sql: string; values: any[] } => {
  console.log(JSON.stringify(props.filter))
  const prefixMap = props.prefixMap ?? {};

  const queryObject = props.filter;
  
  let paramIndex = 1;

  const or: string[] = [];
  const conditions: string[] = [];
  const values: (string | number | boolean | null)[] = [];

  // Build WHERE clause
  for (const [field, value] of Object.entries(queryObject)) {
    if (nonFilters[field]) continue;
    if (!/^[a-zA-Z0-9_]+$/.test(field) && field !== '$or') {
      throw new Error(`Invalid field name: ${field}`);
    }

    // HANDLE OR operator
    if (field === '$or' && Array.isArray(value)) {
      value.forEach((el) => {
        const orFilter = Object.entries(el);
        
        if (orFilter.length > 1) {
          throw new Error('Invalid use of $or operator');
        }

        if (orFilter.length === 0) {
          throw new Error('Invalid use of $or operator');
        }

        const [k, v] = orFilter[0];

        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          or.push(`${getPrefix(k, prefixMap)}${k} = $${paramIndex++}`);
          values.push(v);
        } else if (typeof v === 'object' && v !== null) {
          for (const [op, val] of Object.entries(v)) {
            if (!operatorMap[op]) {
              throw new Error(`Invalid operator: ${op}`);
            }

            if (v === null && op === '$ne') {
              or.push(`${getPrefix(k, prefixMap)}${k} IS NOT NULL`)
            } else {
              or.push(`${getPrefix(k, prefixMap)}${k} ${operatorMap[op]} $${paramIndex++}`);
              values.push(val as string | number | boolean | null);
            }

          }
        } else if (v === null) {
          or.push(`${getPrefix(k, prefixMap)}${k} IS NULL`)
        }
      });
    // HANDLE AND
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      conditions.push(`${getPrefix(field, prefixMap)}${field} = $${paramIndex++}`);
      values.push(value);
    } else if (typeof value === 'object' && value !== null) {
      for (const [op, val] of Object.entries(value)) {
        if (!operatorMap[op]) {
          throw new Error(`Invalid operator: ${op}`);
        }

        if (val === null && op === '$ne') {
          conditions.push(`${getPrefix(field, prefixMap)}${field} IS NOT NULL`)
        } else {
          conditions.push(`${getPrefix(field, prefixMap)}${field} ${operatorMap[op]} $${paramIndex++}`);
          values.push(val as string | number | boolean);
        }

      }
    } else if (value === null) {
      conditions.push(`${getPrefix(field, prefixMap)}${field} IS NULL`)
    }
  }

  // Build ORDER BY clause
  let orderBy = '';
  if (queryObject.$sort) {
    const sortClauses = Object.entries(queryObject.$sort).map(([field, direction]) => {
      if (!/^[a-zA-Z0-9_]+$/.test(field)) {
        throw new Error(`Invalid sort field: ${field}`);
      }
      return `${getPrefix(field, prefixMap)}${field} ${direction === 1 ? 'ASC' : 'DESC'}`;
    });
    orderBy = `ORDER BY ${sortClauses.join(', ')}`;
  }

  // Build LIMIT and OFFSET
  let limit = '';
  if (queryObject.$limit !== undefined) {
    limit = `LIMIT $${paramIndex++}`;
    values.push(queryObject.$limit);
  } else {
    limit = `LIMIT $${paramIndex++}`;
    values.push(10);
  }

  let offset = '';
  if (queryObject.$skip !== undefined) {
    offset = `OFFSET $${paramIndex++}`;
    values.push(queryObject.$skip);
  }

  const where: string[] = [];

  if (or.length) {
    where.push(`(${or.join(' OR ')})`);
  }

  if (conditions.length) {
    where.push(conditions.join(' AND '))
  }

  // Construct SQL query
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `${props.sqlString} ${whereClause} ${orderBy} ${limit} ${offset}`.trim();

  console.log(sql, values);
  
  return {
    sql,
    values,
  };
};
