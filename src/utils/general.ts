export function cx(...things: (string | undefined | null | false)[]) {
  return things.join(" ");
}

export function getTodaysImageURL() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `/api/images/get_image/${yesterday.toISOString().slice(0, 10)}`;
}

type CombineDrizzleOutput<
  CombineBy extends keyof TData,
  TData extends object
> = {
  [K in keyof TData]: K extends CombineBy
    ? TData[K]
    : Exclude<TData[K], null>[];
};

/**
 * A function to format the data that drizzle-orm returns
 *
 * @param data - The data returning from .execute()
 * @param combineBy - The field to combine by
 * @param getKey - A function that takes the field to combine by and returns it's key
 * @returns
 */
export function combineDrizzleData<
  CombineBy extends keyof TData,
  TData extends object,
  Key extends string | number
>({
  data,
  combineBy,
  getKey,
}: {
  data: TData[];
  combineBy: CombineBy;
  getKey: (value: TData[CombineBy]) => Key;
}): CombineDrizzleOutput<CombineBy, TData>[] {
  if (!data.length) {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const nonMainKeys = Object.keys(data[0]!).filter(
    (x) => x !== combineBy
  ) as Exclude<keyof TData, CombineBy>[];

  return Object.values<CombineDrizzleOutput<CombineBy, TData>>(
    data.reduce<Record<Key, CombineDrizzleOutput<CombineBy, TData>>>(
      (acc, row) => {
        const mainData = row[combineBy];
        const key = getKey(mainData);

        if (!acc[key]) {
          acc[key] = {
            [combineBy]: mainData,
          } as unknown as CombineDrizzleOutput<CombineBy, TData>;
          for (const k of nonMainKeys) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            acc[key][k] = [];
          }
        }

        for (const k of nonMainKeys) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (row[k]) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            // eslint-disable-next-line
            acc[key]![k]!.push(row[k]);
          }
        }

        return acc;
      },
      {} as Record<Key, CombineDrizzleOutput<CombineBy, TData>>
    )
  );
}

// const res = combineDrizzleData<
//   "post",
//   {
//     post: { x: number };
//     shape: { y: boolean };
//     comment: { content: string } | null;
//   },
//   number
// >(
//   [
//     { post: { x: 1 }, shape: { y: false }, comment: { content: "abc" } },
//     { post: { x: 1 }, shape: { y: true }, comment: null },
//   ],
//   "post",
//   (post) => post.x
// );

// console.log(res[0]);
