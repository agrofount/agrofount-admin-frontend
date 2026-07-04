import { faCheckCircle, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { toast } from "react-toastify";
import { apiClient } from "../../lib/apiClient";
import { LoadingButtonContent } from "../common/LoadingStates";

const PROVIDERS = [
  { value: "AWS Bedrock", defaultModel: "amazon.nova-lite-v1:0" },
  { value: "Gemini", defaultModel: "gemini-3.1-flash-lite" },
];

const EditAiProviderForm = ({ currentProvider, currentModel, onClose, onSaved }) => {
  const [provider, setProvider] = useState(currentProvider || PROVIDERS[0].value);
  const [model, setModel] = useState(currentModel || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedProviderConfig = PROVIDERS.find((p) => p.value === provider);
  const providerChanged = provider !== currentProvider;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!model.trim()) {
      setError("Enter a model id for the selected provider.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await apiClient.patch("/admin/ai-settings", {
        provider,
        model: model.trim(),
      });
      toast.success(`Ayo will now use ${provider} (${model.trim()}).`);
      onSaved?.(res.data);
      onClose?.();
    } catch (err) {
      const message = err.message || "Failed to update AI provider settings.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between border-b border-[#eef2f6] px-6 py-5">
        <h3 className="text-lg font-semibold text-[#101828]">AI Provider & Model</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="grid h-9 w-9 place-items-center rounded-md border border-[#d0d5dd] text-[#101828] hover:bg-[#f2f4f7]"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5">
        <p className="text-sm text-[#667085]">
          Choose which AI backend Ayo uses to generate replies. Changes take effect immediately — no redeploy needed.
        </p>

        <div className="mt-5">
          <label className="text-sm font-semibold text-[#101828]">Provider</label>
          <select
            value={provider}
            onChange={(event) => {
              const next = event.target.value;
              setProvider(next);
              if (providerChanged || !model.trim()) {
                const config = PROVIDERS.find((p) => p.value === next);
                setModel(config?.defaultModel || "");
              }
            }}
            disabled={saving}
            className="mt-2 h-10 w-full rounded-md border border-[#d0d5dd] px-3 text-sm outline-none focus:border-[#008f45] disabled:bg-[#f9fafb]"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.value}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label className="text-sm font-semibold text-[#101828]">Model ID</label>
          <input
            type="text"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            disabled={saving}
            placeholder={selectedProviderConfig?.defaultModel}
            className="mt-2 h-10 w-full rounded-md border border-[#d0d5dd] px-4 text-sm outline-none focus:border-[#008f45] disabled:bg-[#f9fafb]"
          />
          <p className="mt-1.5 text-xs text-[#667085]">
            Must be a valid model id for {provider}. For example: {selectedProviderConfig?.defaultModel}.
          </p>
        </div>

        {providerChanged && (
          <div className="mt-4 flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <FontAwesomeIcon icon={faCheckCircle} className="mt-0.5 shrink-0" />
            Switching providers — make sure the model id above matches {provider}, not the previous provider.
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md bg-[#fff1f2] px-3 py-2 text-sm text-[#ef3340]">{error}</div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#008f45] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <LoadingButtonContent label="Saving..." /> : "Save Provider Settings"}
        </button>
      </form>
    </div>
  );
};

export default EditAiProviderForm;
