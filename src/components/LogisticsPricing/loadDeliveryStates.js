import { isNigeria } from "./nigeriaStates.js";
// The state endpoint requires a country filter, including for admin requests.
export async function loadDeliveryStates(client, { countryOnly = false } = {}) {
  async function readPages(endpoint, params = {}) {
    const items = [];
    let page = 1;
    let totalPages = 1;
    do {
      const { data } = await client.get(endpoint, { params: { ...params, page, limit: 100 } });
      if (!Array.isArray(data.data)) throw new Error("Unable to read delivery destinations.");
      items.push(...data.data);
      totalPages = Number(data.meta?.totalPages || 1);
      page += 1;
    } while (page <= totalPages);
    return items;
  }

  const countries = await readPages("/country");
  if (countryOnly) return countries.find(isNigeria);
  const states = [];
  for (const country of countries) {
    const countryStates = await readPages("/state", { "filter.country.id": country.id });
    states.push(...countryStates.map((state) => ({ ...state, country: state.country || country })));
  }
  return states.sort((a, b) => a.name.localeCompare(b.name));
}
