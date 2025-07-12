export type BaseQueryObject = {
  $limit?: number;
  $skip?: number;
  $sort?: { [field: string]: 1 | -1 };
  $or?: {
    [field: string]: string | number | boolean | null | ComparisonObjectDefinition;
  }[]
};

export type ComparisonObjectDefinition = {
  $gt?: string | number | boolean | null;
  $lt?: string | number | boolean | null;
  $gte?: string | number | boolean | null;
  $lte?: string | number | boolean | null;
  $ne?: string | number | boolean | null;
};

export type ComparisonObject<T> = {
  $gt?: T;
  $lt?: T;
  $gte?: T;
  $lte?: T;
  $ne?: T;
};

export type QueryField<T extends string | number | boolean | null> = T | ComparisonObject<T>

export type Or<T> = {
  $or: {
    [K in keyof T]: { [P in K]: T[P] } & { [P in Exclude<keyof T, K>]?: never }
  }[keyof T][];
}

export type Fields = {
  [field: string]: {
    type: string | string[];
  }
}
