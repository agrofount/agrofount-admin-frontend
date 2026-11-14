export const normalizeProductLocationMoq = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const normalizedValue = Number(value);
  return Number.isFinite(normalizedValue) ? normalizedValue : undefined;
};

export const getProductLocationMoq = (productLocation) => {
  const directMoq = normalizeProductLocationMoq(productLocation?.moq);
  if (directMoq !== undefined) {
    return directMoq;
  }

  const nestedMoq = Array.isArray(productLocation?.uom)
    ? productLocation.uom
        .map((uom) => normalizeProductLocationMoq(uom?.moq))
        .find((value) => value !== undefined)
    : undefined;

  return nestedMoq;
};

export const attachMoqToUom = (uomSections, moqValue) => {
  const normalizedMoq = normalizeProductLocationMoq(moqValue);
  if (normalizedMoq === undefined) {
    return uomSections;
  }

  return uomSections.map((section) => ({
    ...section,
    moq: normalizeProductLocationMoq(section?.moq) ?? normalizedMoq,
  }));
};

export const DEFAULT_COMMISSION_RATE = 0.7;

// Backend sends decimals as strings (e.g. "1.50") and null when the platform default applies.
export const normalizeCommissionRate = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const rate = Number(value);
  return Number.isFinite(rate) ? rate : null;
};

export const commissionRateToInput = (value) => {
  const rate = normalizeCommissionRate(value);
  return rate === null ? "" : String(rate);
};

export const formatCommissionRate = (value) => {
  const rate = normalizeCommissionRate(value);
  return rate === null
    ? `Default (${DEFAULT_COMMISSION_RATE}%)`
    : `${rate}%`;
};

// Returns { value, error }. value is null when the input is empty (use platform default).
// 0 is a valid rate and is not treated as empty.
export const parseCommissionRateInput = (input) => {
  const text = String(input ?? "").trim();
  if (text === "") {
    return { value: null, error: null };
  }
  if (/^-\d+(\.\d+)?$/.test(text)) {
    return {
      value: null,
      error: "Referral commission must be between 0 and 100",
    };
  }
  if (!/^\d+(\.\d+)?$/.test(text)) {
    return { value: null, error: "Referral commission must be a number" };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return {
      value: null,
      error: "Referral commission can have at most 2 decimal places",
    };
  }
  const rate = Number(text);
  if (rate < 0 || rate > 100) {
    return {
      value: null,
      error: "Referral commission must be between 0 and 100",
    };
  }
  return { value: rate, error: null };
};
