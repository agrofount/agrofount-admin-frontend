export const nigeriaStates = [
  ["AB", "Abia"], ["AD", "Adamawa"], ["AK", "Akwa Ibom"], ["AN", "Anambra"],
  ["BA", "Bauchi"], ["BY", "Bayelsa"], ["BE", "Benue"], ["BO", "Borno"],
  ["CR", "Cross River"], ["DE", "Delta"], ["EB", "Ebonyi"], ["ED", "Edo"],
  ["EK", "Ekiti"], ["EN", "Enugu"], ["FC", "FCT (Abuja)"], ["GO", "Gombe"],
  ["IM", "Imo"], ["JI", "Jigawa"], ["KD", "Kaduna"], ["KN", "Kano"],
  ["KT", "Katsina"], ["KE", "Kebbi"], ["KO", "Kogi"], ["KW", "Kwara"],
  ["LA", "Lagos"], ["NA", "Nasarawa"], ["NI", "Niger"], ["OG", "Ogun"],
  ["ON", "Ondo"], ["OS", "Osun"], ["OY", "Oyo"], ["PL", "Plateau"],
  ["RI", "Rivers"], ["SO", "Sokoto"], ["TA", "Taraba"], ["YO", "Yobe"], ["ZA", "Zamfara"],
];
const normalize = (value = "") => value.toLowerCase().replace(/[^a-z]/g, "").replace(/state$/, "");
export const isNigeria = (country) => normalize(country?.name) === "nigeria" || ["NG", "NGA"].includes(country?.code?.toUpperCase());
export function nigeriaDestinations(states) {
  const local = states.filter((state) => isNigeria(state.country));
  return nigeriaStates.map(([code, name]) => {
    const existing = local.find((state) => normalize(state.name) === normalize(name)
      || (code === "FC" && ["abuja", "fct", "federalcapitalterritory", "abujafct", "federalcapitalterritoryabuja"].includes(normalize(state.name)))
      || state.code?.toUpperCase().replace(/^NG-/, "") === code);
    return existing ? { ...existing, name } : { id: `NG-${code}`, code, name, needsSetup: true };
  });
}
