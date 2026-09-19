import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTruckFast, faLocationDot, faCircleCheck, faXmark, faPen, faTrash, faCirclePause, faLightbulb, faBookOpen, faRotateRight, faMagnifyingGlass, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { apiClient } from "../../lib/apiClient";
import { ACTIONS, RESOURCES } from "../../constants/permissions";
import { usePermission } from "../Hooks/usePermission";
import { nigeriaDestinations } from "./nigeriaStates";
import { loadDeliveryStates } from "./loadDeliveryStates";

const modes = { per_order: "Per order", per_unit: "Per unit", per_carton: "Per carton" };
const categories = ["poultry", "aquaculture", "ruminants", "pig", "pets", "cattle", "fish", "small_ruminant", "rabbit", "snail", "apiculture", "grasscutter", "dog", "cat"];
const freshForm = { stateId: "", primaryCategory: "", category: "", subCategory: "", unit: "", pricingMode: "per_carton", price: "", cartonSize: "50", isActive: true };
const inputClass = "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100";
const buttonClass = "rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50";
const primaryClass = "rounded-lg bg-[#008f45] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#00743a] disabled:opacity-50";
const money = (value) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(value));
const label = (value) => value.replaceAll("_", " ");
const errorMessage = (error) => Array.isArray(error.message) ? error.message.join(". ") : error.message || "Something went wrong. Please try again.";

export default function LogisticsPricing() {
  const { hasPermission } = usePermission();
  const canCreateState = hasPermission(RESOURCES.STATES, ACTIONS.CREATE);
  const canCreateCountry = hasPermission(RESOURCES.COUNTRIES, ACTIONS.CREATE);
  const canCreate = hasPermission(RESOURCES.LOGISTICS_PRICING, ACTIONS.CREATE);
  const canUpdate = hasPermission(RESOURCES.LOGISTICS_PRICING, ACTIONS.UPDATE);
  const canDelete = hasPermission(RESOURCES.LOGISTICS_PRICING, ACTIONS.DELETE);
  const [rules, setRules] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statesError, setStatesError] = useState("");
  const [statesLoading, setStatesLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [infoPanel, setInfoPanel] = useState(null);
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(freshForm);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/logistics-pricing");
      if (!Array.isArray(response.data)) throw new Error("The server returned an unexpected pricing response.");
      setRules(response.data);
    } catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }, []);

  const loadStates = useCallback(async () => {
    setStatesLoading(true);
    setStatesError("");
    try {
      setStates(await loadDeliveryStates(apiClient));
    } catch (err) { setStatesError(errorMessage(err)); }
    finally { setStatesLoading(false); }
  }, []);

  useEffect(() => { loadRules(); loadStates(); }, [loadRules, loadStates]);

  const stateOptions = useMemo(() => {
    const map = new Map(states.map((state) => [state.id, state]));
    rules.forEach((rule) => { if (rule.state) map.set(rule.state.id, rule.state); });
    return nigeriaDestinations([...map.values()]);
  }, [states, rules]);
  const filtered = rules.filter((rule) => (!stateFilter || rule.state?.id === stateFilter)
    && (!categoryFilter || rule.primaryCategory === categoryFilter)
    && (!unitFilter || rule.unit === unitFilter)
    && (!statusFilter || String(rule.isActive) === statusFilter)
    && [rule.state?.name, rule.primaryCategory, rule.category, rule.subCategory, rule.unit].filter(Boolean).join(" ").toLowerCase().includes(search.trim().toLowerCase()));
  const activeRules = rules.filter((rule) => rule.isActive);
  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const openEditor = (rule = null) => {
    setForm(rule ? { ...freshForm, ...rule, stateId: rule.state.id, primaryCategory: rule.primaryCategory || "", category: rule.category || "", subCategory: rule.subCategory || "", unit: rule.unit || "", cartonSize: rule.cartonSize ?? "50" } : { ...freshForm });
    setFormError("");
    setEditor(rule || {});
  };
  const saveRule = async (event) => {
    event.preventDefault();
    if (busy || !(editor?.id ? canUpdate : canCreate)) return;
    setBusy(true);
    setFormError("");
    let destinationId = form.stateId;
    const selectedDestination = stateOptions.find((state) => state.id === destinationId);
    if (selectedDestination?.needsSetup) {
      try {
        if (!canCreateState) throw new Error("An administrator with state creation permission must add this destination first.");
        let country = await loadDeliveryStates(apiClient, { countryOnly: true });
        if (!country) {
          if (!canCreateCountry) throw new Error("An administrator must add Nigeria to the country list first.");
          country = (await apiClient.post("/country", { name: "Nigeria", code: "NG", isActive: true })).data;
        }
        const current = nigeriaDestinations(await loadDeliveryStates(apiClient)).find((state) => state.code === selectedDestination.code || state.name === selectedDestination.name);
        if (current && !current.needsSetup) destinationId = current.id;
        else destinationId = (await apiClient.post("/state", { name: selectedDestination.name === "FCT (Abuja)" ? "Federal Capital Territory" : selectedDestination.name, code: selectedDestination.code, countryId: country.id, isActive: true })).data.id;
        if (!destinationId) throw new Error("The server did not return a destination ID.");
        setForm((currentForm) => ({ ...currentForm, stateId: destinationId }));
        await loadStates();
      } catch (err) { setFormError(errorMessage(err)); setBusy(false); return; }
    }
    const payload = {
      stateId: destinationId,
      primaryCategory: form.primaryCategory || null,
      category: form.category || null,
      subCategory: form.subCategory.trim() || null,
      unit: form.unit.trim() || null,
      pricingMode: form.pricingMode,
      price: Number(form.price),
      ...(form.pricingMode === "per_carton" ? { cartonSize: Number(form.cartonSize) } : {}),
      isActive: form.isActive,
    };
    try {
      if (editor.id) await apiClient.patch(`/logistics-pricing/${editor.id}`, payload);
      else await apiClient.post("/logistics-pricing", payload);
      toast.success(editor.id ? "Pricing rule updated" : "Pricing rule created");
      setEditor(null);
      await loadRules();
    } catch (err) { setFormError(errorMessage(err)); }
    finally { setBusy(false); }
  };
  const toggleRule = async (rule) => {
    if (busy || !canUpdate) return;
    setBusy(true);
    try {
      await apiClient.patch(`/logistics-pricing/${rule.id}`, { isActive: !rule.isActive });
      toast.success(rule.isActive ? "Rule deactivated" : "Rule activated");
      await loadRules();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setBusy(false); }
  };
  const deleteRule = async () => {
    if (busy || !canDelete) return;
    setBusy(true);
    try {
      await apiClient.delete(`/logistics-pricing/${deleting.id}`);
      toast.success("Pricing rule deleted");
      setDeleting(null);
      await loadRules();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="w-full space-y-6 text-[#101828]">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-3 text-xs text-slate-500"><span>Inventory & Operations</span><FontAwesomeIcon icon={faChevronRight} className="text-[10px]" /><span className="font-semibold text-slate-900">Delivery Pricing</span></nav><h1 className="text-3xl font-bold tracking-tight text-slate-950">Delivery Pricing</h1></div>
          <div className="flex flex-wrap gap-3"><button className={buttonClass} onClick={() => setInfoPanel("coverage")}><FontAwesomeIcon icon={faLocationDot} className="mr-2" />View delivery zones</button>{canCreate && <button className={`${primaryClass} bg-gradient-to-b from-green-600 to-green-700 shadow-sm`} onClick={() => openEditor()} disabled={busy}><FontAwesomeIcon icon={faPlus} className="mr-2" />Add pricing rule</button>}</div>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">Set delivery charges by destination, product and unit. Create flexible pricing rules to ensure accurate delivery fees across Nigeria.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [faTruckFast, "Total pricing rules", rules.length, rules.length ? "All configured rules." : "Create your first rule to get started.", "border-green-100 bg-green-50/60", "bg-green-100 text-green-600"],
          [faCircleCheck, "Active rules", activeRules.length, "Rules currently in effect.", "border-blue-100 bg-blue-50/60", "bg-blue-100 text-sky-600"],
          [faCirclePause, "Inactive rules", rules.length - activeRules.length, "Rules currently paused.", "border-amber-100 bg-amber-50/60", "bg-amber-100 text-amber-600"],
          [faLocationDot, "States with active rules", new Set(activeRules.map((rule) => rule.state?.id)).size, "Coverage across Nigeria.", "border-purple-100 bg-purple-50/60", "bg-purple-100 text-purple-600"],
        ].map(([icon, title, value, description, cardStyle, iconStyle]) => (
          <div key={title} className={`flex min-h-[124px] items-start gap-4 rounded-xl border p-5 ${cardStyle}`}><span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl ${iconStyle}`}><FontAwesomeIcon icon={icon} /></span><div className="min-w-0"><p className="text-xs font-medium">{title}</p><p className="mt-1 text-2xl font-bold">{loading || error ? "—" : value}</p><p className="mt-2 text-[11px] leading-4 text-slate-600">{description}</p></div></div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-green-200 bg-[#eaf8f0] p-4 text-sm text-[#185c36]">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-green-100 text-2xl"><FontAwesomeIcon icon={faLightbulb} /></span>
        <div className="min-w-0 flex-1 basis-64"><p className="font-bold">How delivery pricing works</p><p className="mt-1 text-xs leading-5 text-slate-700">The most specific active rule applies. When no rule matches, delivery defaults to ₦4,000 per carton of 50 units. A per-order rule is charged once per matching rule; partial cartons round up.</p></div>
        <button className={`${buttonClass} border-green-200 text-xs`} onClick={() => setInfoPanel("help")}><FontAwesomeIcon icon={faBookOpen} className="mr-2" />Learn more</button>
      </div>

      <section className="min-h-[430px] overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4"><div><h2 className="text-base font-bold">Pricing rules</h2><p className="mt-1 text-xs text-gray-500">Manage the rates used to calculate delivery fees.</p></div><button className={buttonClass} onClick={loadRules} disabled={loading || busy}><FontAwesomeIcon icon={faRotateRight} className="mr-2" />Refresh</button></div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-[1.8fr_1.1fr_1fr_1fr_1fr]">
          <div className="relative"><FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none absolute left-3 top-5 text-sm text-slate-400" /><input aria-label="Search pricing rules" className={`${inputClass} pl-9`} placeholder="Search state, category or unit…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <select aria-label="Filter by state" className={inputClass} value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}><option value="">All states</option>{stateOptions.map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}</select>
          <select aria-label="Filter by category" className={inputClass} value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">All categories</option>{["feed", "drug", "equipment", "livestock"].map((value) => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select>
          <select aria-label="Filter by unit" className={inputClass} value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)}><option value="">All units</option>{[...new Set(rules.map((rule) => rule.unit).filter(Boolean))].sort().map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <select aria-label="Filter by status" className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select>
        </div>
        {statesError && <p role="alert" className="mx-5 mb-4 text-sm text-amber-700">Could not load all states. {statesError} <button className="underline" onClick={loadStates}>Retry states</button></p>}
        {loading ? <div role="status" className="p-16 text-center text-gray-500">Loading pricing rules…</div> : error ? <div role="alert" className="p-10 text-center text-red-700">{error}<p className="mt-2 text-sm">Use Refresh to try again.</p></div> : filtered.length === 0 ? <div className="flex min-h-[295px] flex-col items-center justify-center px-5 pb-6 pt-2 text-center"><svg viewBox="0 0 240 140" aria-hidden="true" className="mb-4 h-32 w-56">
          <circle cx="120" cy="77" r="68" fill="#eff6f9" /><path d="M22 35h30a9 9 0 0 0-16-5 7 7 0 0 0-14 5M184 44h36a10 10 0 0 0-19-4 9 9 0 0 0-17 4" fill="#eaf3f8" />
          <path d="M34 133q84-32 172 0" fill="#b9ebcf" /><path d="M34 132q-20-8-20-27 24 2 20 27M204 132q22-9 23-28-23 1-23 28" fill="#8dc63f" />
          <path d="M66 56h68l-3 53H64" fill="white" stroke="#103c3c" strokeWidth="4" strokeLinejoin="round" /><path d="M135 72h20l17 24v15h-41" fill="#176344" stroke="#103c3c" strokeWidth="4" strokeLinejoin="round" /><path d="M142 78h10l10 16h-20" fill="#c8dfab" />
          <path d="M58 70h23M51 80h25M57 90h24" stroke="#103c3c" strokeWidth="3" strokeLinecap="round" /><circle cx="83" cy="111" r="11" fill="#10313b" /><circle cx="83" cy="111" r="5" fill="#e7eef4" /><circle cx="151" cy="111" r="11" fill="#10313b" /><circle cx="151" cy="111" r="5" fill="#e7eef4" />
        </svg><h3 className="text-base font-bold">{rules.length ? "No matching rules" : "No delivery pricing rules yet"}</h3><p className="mt-2 text-sm text-gray-500">{rules.length ? "Try another search or clear your filters." : "Add your first pricing rule to set delivery charges by state, product or unit."}</p>{rules.length > 0 && <button className={`${buttonClass} mt-4`} onClick={() => { setSearch(""); setStateFilter(""); setStatusFilter(""); setCategoryFilter(""); setUnitFilter(""); }}>Clear filters</button>}{rules.length === 0 && canCreate && <button className={`${primaryClass} mt-5 bg-gradient-to-b from-green-600 to-green-700 px-6`} onClick={() => openEditor()} disabled={busy}><FontAwesomeIcon icon={faPlus} className="mr-3" />Add your first pricing rule</button>}</div> : <>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr>{["Destination", "Product matching", "Delivery rate", "Status", "Actions"].map((title) => <th key={title} className="whitespace-nowrap px-5 py-3 font-medium">{title}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{filtered.map((rule) => <tr key={rule.id} className="hover:bg-gray-50/70">
            <td className="whitespace-nowrap px-5 py-5 font-medium">{rule.state?.name || "Unknown state"}</td>
            <td className="min-w-48 px-5 py-5"><div className="capitalize">{[rule.primaryCategory, rule.category, rule.subCategory].filter(Boolean).map(label).join(" · ") || "All products"}</div><p className="mt-1 text-xs text-gray-500">{rule.unit ? `Unit: ${rule.unit}` : "All units"}</p></td>
            <td className="whitespace-nowrap px-5 py-5"><p className="font-semibold">{money(rule.price)}</p><p className="mt-1 text-xs text-gray-500">{modes[rule.pricingMode]}{rule.pricingMode === "per_carton" ? ` · ${rule.cartonSize} units/carton` : ""}</p></td>
            <td className="px-5 py-5"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${rule.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>{rule.isActive ? "Active" : "Inactive"}</span></td>
            <td className="px-5 py-5"><div className="flex items-center gap-3">{canUpdate && <><button disabled={busy} aria-label={`Edit pricing for ${rule.state?.name}`} className="p-2 text-gray-500 hover:text-green-700 disabled:opacity-50" onClick={() => openEditor(rule)}><FontAwesomeIcon icon={faPen} /></button><button disabled={busy} className="text-xs font-medium text-green-700 disabled:opacity-50" onClick={() => toggleRule(rule)}>{rule.isActive ? "Deactivate" : "Activate"}</button></>}{canDelete && <button disabled={busy} aria-label={`Delete pricing for ${rule.state?.name}`} className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-50" onClick={() => setDeleting(rule)}><FontAwesomeIcon icon={faTrash} /></button>}{!canUpdate && !canDelete && <span className="text-xs text-gray-400">View only</span>}</div></td>
          </tr>)}</tbody></table></div><p className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500">Showing {filtered.length} of {rules.length} pricing rules</p>
        </>}
      </section>

      <Dialog open={infoPanel !== null} onClose={() => setInfoPanel(null)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-slate-950/40" />
        <div className="fixed inset-0 flex items-center justify-center p-4"><DialogPanel className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between gap-4"><DialogTitle className="text-lg font-bold">{infoPanel === "coverage" ? "Delivery zones" : "How delivery pricing works"}</DialogTitle><button aria-label="Close information" className={buttonClass} onClick={() => setInfoPanel(null)}><FontAwesomeIcon icon={faXmark} /></button></div>
          {infoPanel === "coverage" ? <div className="mt-4"><p className="mb-4 text-sm text-slate-500">Pricing is configured by state. Counts show active rules; unmatched products use the default charge.</p>{loading || statesLoading ? <p role="status">Loading destinations…</p> : error || statesError ? <p role="alert" className="text-red-700">{error || statesError}</p> : stateOptions.length ? <ul className="divide-y divide-gray-100">{stateOptions.map((state) => <li key={state.id} className="flex justify-between gap-3 py-3 text-sm"><span>{state.name}</span><span className="text-slate-500">{activeRules.filter((rule) => rule.state?.id === state.id).length} active rules</span></li>)}</ul> : <p className="text-sm text-slate-500">No destination states are available.</p>}</div> : <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600"><p>Rules match the destination state and any product category, animal category, subcategory or unit you specify. The active rule with the most matching fields takes priority.</p><p><strong>Per order:</strong> charged once for each matching rule. <strong>Per unit:</strong> multiplied by quantity. <strong>Per carton:</strong> quantity divided by carton size, rounded up. Units containing “carton” are already counted as cartons.</p><p>Without a matching rule, the default is ₦4,000 per carton of 50 units. Inactive rules are excluded. Avoid overlapping rules with the same specificity.</p></div>}
        </DialogPanel></div>
      </Dialog>

      <Dialog open={editor !== null} onClose={() => { if (!busy) setEditor(null); }} className="relative z-50">
        <DialogBackdrop transition className="fixed inset-0 bg-[#101828]/45 transition-opacity duration-200 data-[closed]:opacity-0" />
        <div className="fixed inset-0 flex justify-end sm:top-[76px]">
          <DialogPanel transition className="flex h-full w-full max-w-[470px] flex-col overflow-hidden bg-white shadow-2xl transition duration-200 ease-out data-[closed]:translate-x-full sm:rounded-tl-xl">
            <div className="flex shrink-0 items-start justify-between gap-4 px-6 pb-6 pt-7">
              <div><DialogTitle className="text-xl font-bold tracking-tight text-[#101828]">{editor?.id ? "Edit Pricing Rule" : "Add Pricing Rule"}</DialogTitle><p className="mt-1 text-[13px] leading-5 text-[#667085]">Set delivery charges for a specific state, product and unit.</p></div>
              <button aria-label="Close pricing form" disabled={busy} onClick={() => setEditor(null)} className="-mr-1 rounded-md p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline-green-600 disabled:opacity-50"><FontAwesomeIcon icon={faXmark} className="text-lg" /></button>
            </div>
            <form onSubmit={saveRule} className="flex min-h-0 flex-1 flex-col">
              <fieldset disabled={busy} className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 pb-6 pt-2">
                <div>
                  <label className="block text-sm font-semibold">State <span className="text-red-600">*</span><select required name="stateId" className={inputClass} value={form.stateId} onChange={updateField} aria-describedby="pricing-state-help"><option value="">{statesLoading ? "Loading states…" : "Select state"}</option>{stateOptions.map((state) => <option key={state.id} value={state.id}>{state.name}{state.country?.name ? ` (${state.country.name})` : ""}</option>)}</select></label>
                  <p id="pricing-state-help" className="mt-1.5 text-xs leading-5 text-[#667085]">All 36 Nigerian states and FCT (Abuja) are available.</p>
                  {stateOptions.find((state) => state.id === form.stateId)?.needsSetup && <p className="mt-2 text-xs text-amber-700">{canCreateState ? "This destination will be added when you save the pricing rule." : "An administrator must add this destination before you can save a rule."}</p>}
                  {statesError && <p role="alert" className="mt-2 text-sm text-amber-700">{statesError} <button type="button" onClick={loadStates} className="underline">Retry states</button></p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold">Product Category<select name="primaryCategory" className={inputClass} value={form.primaryCategory} onChange={updateField} aria-describedby="pricing-category-help"><option value="">All product categories</option>{["feed", "drug", "equipment", "livestock"].map((value) => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select></label>
                  <p id="pricing-category-help" className="mt-1.5 text-xs leading-5 text-[#667085]">Choose the product category this rule applies to.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold">Unit<input name="unit" list="pricing-unit-options" maxLength={40} placeholder="Select or enter unit" className={inputClass} value={form.unit} onChange={updateField} aria-describedby="pricing-unit-help" /></label>
                  <datalist id="pricing-unit-options"><option value="piece" /><option value="carton" /><option value="bag" /><option value="kg" /></datalist>
                  <p id="pricing-unit-help" className="mt-1.5 text-xs leading-5 text-[#667085]">Choose the unit of measurement. Leave blank for all units.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold">Delivery Charge (₦) <span className="text-red-600">*</span><input required type="number" name="price" min="0" max="99999999.99" step="0.01" placeholder="0" className={inputClass} value={form.price} onChange={updateField} aria-describedby="pricing-charge-help" /></label>
                  <p id="pricing-charge-help" className="mt-1.5 text-xs leading-5 text-[#667085]">Enter the delivery fee for the selected combination.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">Pricing Mode <span className="text-red-600">*</span><select name="pricingMode" className={inputClass} value={form.pricingMode} onChange={updateField}>{Object.entries(modes).map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>
                  {form.pricingMode === "per_carton" && <label className="block text-sm font-semibold">Units per Carton <span className="text-red-600">*</span><input required type="number" name="cartonSize" min="1" max="2147483647" step="1" className={inputClass} value={form.cartonSize} onChange={updateField} /></label>}
                </div>
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold">Status</legend>
                  <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                    {[{ value: true, title: "Active", description: "Apply this rule immediately" }, { value: false, title: "Inactive", description: "Save without applying" }].map((status) => <label key={status.title} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition focus-within:ring-2 focus-within:ring-green-600 ${form.isActive === status.value ? "border-green-400 bg-green-50/70" : "border-gray-300 bg-white"}`}>
                      <input type="radio" name="pricing-status" checked={form.isActive === status.value} onChange={() => setForm((current) => ({ ...current, isActive: status.value }))} className="mt-1 h-4 w-4 shrink-0 accent-[#008f45]" />
                      <span><span className="text-sm font-semibold">{status.title}</span><span className={`mt-1 block text-[11px] leading-4 ${form.isActive === status.value ? "text-green-700" : "text-[#667085]"}`}>{status.description}</span></span>
                    </label>)}
                  </div>
                </fieldset>
                <details className="rounded-lg border border-gray-200 p-3.5" open={Boolean(editor?.category || editor?.subCategory) || undefined}>
                  <summary className="cursor-pointer text-sm font-semibold">Additional product matching <span className="font-normal text-gray-500">(Optional)</span></summary>
                  <div className="mt-4 space-y-4">
                    <label className="block text-sm font-medium">Animal Category<select name="category" className={inputClass} value={form.category} onChange={updateField}><option value="">All animal categories</option>{categories.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
                    <label className="block text-sm font-medium">Subcategory<input name="subCategory" maxLength={120} placeholder="e.g. Chick" className={inputClass} value={form.subCategory} onChange={updateField} /></label>
                  </div>
                </details>
                <p className="text-xs leading-5 text-[#667085]">{form.pricingMode === "per_carton" ? "Partial cartons round up. Units containing ‘carton’ are already counted as cartons." : form.pricingMode === "per_unit" ? "The charge is multiplied by the matching item quantity." : "Charged once for this rule, even when multiple items match."}</p>
                {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
              </fieldset>
              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 bg-white px-6 py-5">
                <button type="button" className={buttonClass} disabled={busy} onClick={() => setEditor(null)}>Cancel</button>
                <button type="submit" className={`${primaryClass} px-6`} disabled={busy || !form.stateId || (stateOptions.find((state) => state.id === form.stateId)?.needsSetup && !canCreateState)}>{busy ? "Saving…" : "Save Pricing Rule"}</button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
      <Dialog open={deleting !== null} onClose={() => { if (!busy) setDeleting(null); }} className="relative z-50"><DialogBackdrop className="fixed inset-0 bg-black/40" /><div className="fixed inset-0 flex items-center justify-center p-4"><DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><DialogTitle className="text-lg font-semibold">Delete pricing rule?</DialogTitle><p className="mt-3 text-sm leading-6 text-gray-600">Remove the {deleting && money(deleting.price)} {deleting && modes[deleting.pricingMode]?.toLowerCase()} rule for {deleting?.state?.name}? Future delivery calculations will use another matching rule or the default charge.</p><div className="mt-6 flex justify-end gap-3"><button className={buttonClass} disabled={busy} onClick={() => setDeleting(null)}>Cancel</button><button className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} onClick={deleteRule}>{busy ? "Deleting…" : "Delete rule"}</button></div></DialogPanel></div></Dialog>
    </div>
  );
}
