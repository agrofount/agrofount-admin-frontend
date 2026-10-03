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
