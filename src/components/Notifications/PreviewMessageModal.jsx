import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { apiClient, parseApiError } from "../../lib/apiClient";
import ModalComponent from "../modals/ModalComponent";

const PreviewMessageModal = ({ isOpen, onClose, title, jobName }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !jobName) return;
    setLoading(true);
    setError("");
    setPreview(null);
    apiClient
      .get(`/message/cron-jobs/${jobName}/preview`)
      .then((res) => setPreview(res.data))
      .catch((err) => {
        setError(parseApiError(err).message || "Failed to load preview.");
      })
      .finally(() => setLoading(false));
  }, [isOpen, jobName]);

  return (
    <ModalComponent
      isModalOpen={isOpen}
      onClose={onClose}
      title={title ? `Preview — ${title}` : "Preview message"}
      panelClassName="max-w-2xl w-full"
    >
      <div className="max-h-[70vh] overflow-y-auto">
        {loading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-[#f0f2f5]" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-lg bg-[#fee2e2] px-4 py-3 text-sm text-[#ef3340]">
            <FontAwesomeIcon icon={faTriangleExclamation} />
            {error}
          </div>
        ) : !preview ? null : (
          <div className="space-y-4">
            {preview.channel === "EMAIL" && preview.html ? (
              <div>
                {preview.subject && (
                  <p className="mb-2 text-sm font-semibold text-[#101828]">
                    Subject: {preview.subject}
                  </p>
                )}
                <iframe
                  title="Email preview"
                  sandbox="allow-same-origin"
                  srcDoc={preview.html}
                  className="h-[420px] w-full rounded-lg border border-[#e5e7eb] bg-white"
                />
              </div>
            ) : preview.channel === "EMAIL" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg bg-[#fef3c7] px-4 py-3 text-xs text-[#92400e]">
                  <FontAwesomeIcon icon={faTriangleExclamation} />
                  Could not load the visual template
                  {preview.templateId ? ` (template #${preview.templateId})` : ""}.
                  Showing the parameters that would be sent instead.
                </div>
                {preview.subject && (
                  <p className="text-sm font-semibold text-[#101828]">
                    Subject: {preview.subject}
                  </p>
                )}
                {preview.params && (
                  <div className="overflow-x-auto rounded-lg border border-[#e5e7eb]">
                    <table className="w-full min-w-[400px] border-collapse text-left text-xs">
                      <tbody className="divide-y divide-[#f0f2f5]">
                        {Object.entries(preview.params).map(([key, value]) => (
                          <tr key={key}>
                            <td className="px-3 py-2 font-medium text-[#344054]">{key}</td>
                            <td className="px-3 py-2 text-[#667085]">{String(value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : preview.channel === "SMS" ? (
              <div className="mx-auto max-w-sm rounded-2xl rounded-bl-sm bg-[#f0f2f5] px-4 py-3 text-sm text-[#101828]">
                {preview.text}
              </div>
            ) : (
              <div className="rounded-lg border border-[#e5e7eb] bg-white p-4">
                {preview.subject && (
                  <p className="mb-1 text-sm font-semibold text-[#101828]">{preview.subject}</p>
                )}
                <p className="text-sm text-[#344054]">{preview.text}</p>
              </div>
            )}

            <p className="border-t border-[#f0f2f5] pt-3 text-xs text-[#667085]">
              {preview.usedFallbackSample
                ? "No one currently matches this job's criteria — showing a placeholder sample."
                : `Preview uses a real current target${
                    preview.sampleTarget?.name ? ` (${preview.sampleTarget.name})` : ""
                  }.`}
            </p>
          </div>
        )}
      </div>
    </ModalComponent>
  );
};

export default PreviewMessageModal;
