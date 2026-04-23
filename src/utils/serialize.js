export const toNumber = (value) => {
  if (typeof value === "bigint") return Number(value);
  if (value == null) return 0;
  return Number(value);
};

export const toSafeJson = (data) =>
  JSON.parse(
    JSON.stringify(data, (_, value) => {
      if (typeof value === "bigint") return Number(value);
      if (value instanceof Date) return value.toISOString();
      return value;
    }),
  );
