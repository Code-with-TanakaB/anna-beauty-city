// South African numbers: 0xx xxx xxxx or +27 xx xxx xxxx. Returns +27 form, or "" when invalid.
export const normPhone = (s: string) => {
  const m = /^(?:\+27|0)([1-8]\d{8})$/.exec(s.replace(/[\s-]/g, ""));
  return m ? "+27" + m[1] : "";
};
