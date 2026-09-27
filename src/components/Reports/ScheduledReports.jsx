import { faArrowLeft, faChevronRight, faPlus, faSearch, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { apiClient } from "../../lib/apiClient";

const initialForm = { name: "", type: "sales", format: "xlsx", frequency: "weekly", dayOfWeek: 1, dayOfMonth: 1, time: "08:00", recipients: "" };
const inputClass = "h-10 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-sm outline-none focus:border-[#008f45]";

const describeSchedule = (schedule) => {
  const time = String(schedule.time).slice(0, 5);
  if (schedule.frequency === "daily") return `Daily at ${time}`;
  if (schedule.frequency === "weekly") {
    const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][schedule.dayOfWeek];
    return `Every ${day} at ${time}`;
  }
  return `Day ${schedule.dayOfMonth} of every month at ${time}`;
};

const ScheduledReports = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/reports/schedules");
      setSchedules(data);
    } catch (error) {
      toast.error(error.message || "Unable to load scheduled reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  const visibleSchedules = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? schedules.filter((schedule) => schedule.name.toLowerCase().includes(term)) : schedules;
  }, [schedules, search]);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const createSchedule = async (event) => {
    event.preventDefault();
    const recipients = form.recipients.split(",").map((value) => value.trim()).filter(Boolean);
    if (!form.name.trim() || recipients.length === 0) {
      toast.error("A schedule name and at least one recipient are required");
      return;
    }
    try {
      setSaving(true);
      await apiClient.post("/reports/schedules", { ...form, name: form.name.trim(), recipients, filters: {} });
      toast.success("Report schedule created");
      setForm(initialForm);
      setFormOpen(false);
      await loadSchedules();
    } catch (error) {
      toast.error(error.message || "Unable to create schedule");
    } finally {
      setSaving(false);
    }
  };

  const toggleSchedule = async (schedule) => {
    try {
      const { data } = await apiClient.patch(`/reports/schedules/${schedule.id}`, { active: !schedule.active });
      setSchedules((current) => current.map((item) => item.id === data.id ? data : item));
    } catch (error) {
      toast.error(error.message || "Unable to update schedule");
    }
  };

  const deleteSchedule = async (schedule) => {
    if (!window.confirm(`Delete “${schedule.name}”?`)) return;
    try {
      await apiClient.delete(`/reports/schedules/${schedule.id}`);
      setSchedules((current) => current.filter((item) => item.id !== schedule.id));
      toast.success("Report schedule deleted");
    } catch (error) {
      toast.error(error.message || "Unable to delete schedule");
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4 text-[#101828]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs text-[#667085]"><Link to="/reports" className="hover:text-[#008f45]">Reports</Link><FontAwesomeIcon icon={faChevronRight} className="text-[10px]" /><span>Scheduled Reports</span></div>
          <h1 className="text-2xl font-bold">Scheduled Reports</h1>
          <p className="mt-1 text-sm text-[#667085]">Create and manage recurring reports for your team.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/reports" className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d0d5dd] px-4 text-sm font-semibold"><FontAwesomeIcon icon={faArrowLeft} /> Back to Reports</Link>
          <button type="button" onClick={() => setFormOpen((open) => !open)} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#008f45] px-4 text-sm font-semibold text-white"><FontAwesomeIcon icon={faPlus} /> {formOpen ? "Close" : "Add Schedule"}</button>
        </div>
      </div>

      {formOpen && (
        <form onSubmit={createSchedule} className="rounded-lg border border-[#cfeedd] bg-[#f0fbf5] p-4 shadow-sm">
          <h2 className="mb-4 text-base font-semibold">New report schedule</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label><span className="mb-1 block text-xs font-semibold">Name</span><input value={form.name} onChange={(event) => updateForm("name", event.target.value)} className={inputClass} placeholder="Weekly sales report" /></label>
            <label><span className="mb-1 block text-xs font-semibold">Report type</span><select value={form.type} onChange={(event) => updateForm("type", event.target.value)} className={inputClass}><option value="sales">Sales</option><option value="customer">Customer</option><option value="inventory">Inventory</option><option value="career">Career</option></select></label>
            <label><span className="mb-1 block text-xs font-semibold">Format</span><select value={form.format} onChange={(event) => updateForm("format", event.target.value)} className={inputClass}><option value="xlsx">Excel</option><option value="csv">CSV</option><option value="pdf">PDF</option></select></label>
            <label><span className="mb-1 block text-xs font-semibold">Frequency</span><select value={form.frequency} onChange={(event) => updateForm("frequency", event.target.value)} className={inputClass}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
            {form.frequency === "weekly" && <label><span className="mb-1 block text-xs font-semibold">Day</span><select value={form.dayOfWeek} onChange={(event) => updateForm("dayOfWeek", Number(event.target.value))} className={inputClass}>{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>}
            {form.frequency === "monthly" && <label><span className="mb-1 block text-xs font-semibold">Day of month</span><input type="number" min="1" max="28" value={form.dayOfMonth} onChange={(event) => updateForm("dayOfMonth", Number(event.target.value))} className={inputClass} /></label>}
            <label><span className="mb-1 block text-xs font-semibold">Time</span><input type="time" value={form.time} onChange={(event) => updateForm("time", event.target.value)} className={inputClass} /></label>
            <label className="md:col-span-2"><span className="mb-1 block text-xs font-semibold">Recipients</span><input value={form.recipients} onChange={(event) => updateForm("recipients", event.target.value)} className={inputClass} placeholder="email@example.com, team@example.com" /></label>
          </div>
          <div className="mt-4 flex justify-end"><button type="submit" disabled={saving} className="h-10 rounded-md bg-[#008f45] px-5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : "Create Schedule"}</button></div>
        </form>
      )}

      <section className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm">
        <label className="relative mb-4 block max-w-sm"><FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" /><input value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} pl-9`} placeholder="Search scheduled reports…" /></label>
        <div className="overflow-x-auto rounded-md border border-[#e5e7eb]">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-[#f8fafc]"><tr>{["Report", "Type", "Schedule", "Recipients", "Format", "Next run", "Status", "Actions"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-[#eef2f6]">
              {visibleSchedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td className="px-4 py-3 font-semibold">{schedule.name}</td><td className="px-4 py-3 capitalize">{schedule.type}</td><td className="px-4 py-3">{describeSchedule(schedule)}</td><td className="px-4 py-3">{schedule.recipients.length}</td><td className="px-4 py-3 uppercase">{schedule.format}</td><td className="px-4 py-3">{new Date(schedule.nextRunAt).toLocaleString("en-GB")}</td>
                  <td className="px-4 py-3"><button type="button" onClick={() => toggleSchedule(schedule)} className={`relative h-6 w-11 rounded-full ${schedule.active ? "bg-[#008f45]" : "bg-[#d0d5dd]"}`} aria-label={`${schedule.active ? "Pause" : "Enable"} ${schedule.name}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${schedule.active ? "left-6" : "left-1"}`} /></button></td>
                  <td className="px-4 py-3"><button type="button" onClick={() => deleteSchedule(schedule)} className="text-[#dc2626]" aria-label={`Delete ${schedule.name}`}><FontAwesomeIcon icon={faTrash} /></button></td>
                </tr>
              ))}
              {!loading && visibleSchedules.length === 0 && <tr><td colSpan="8" className="px-4 py-12 text-center text-[#667085]">No scheduled reports found.</td></tr>}
              {loading && <tr><td colSpan="8" className="px-4 py-12 text-center text-[#667085]">Loading schedules…</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-[#667085]">Showing {visibleSchedules.length} scheduled reports</p>
      </section>
    </div>
  );
};

export default ScheduledReports;
