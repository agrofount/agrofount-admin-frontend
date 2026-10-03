export function getLeadSmsCount(lead) {
  if (!lead || typeof lead !== "object") return 0;

  const candidates = [
    lead.smsCount,
    lead.sms_count,
    lead.smsSentCount,
    lead.totalSmsSent,
    lead.totalSms,
    lead.smsReceivedCount,
    lead.smsReceived,
    lead.smsTotal,
    lead.messagesSent,
    lead.smsStats?.count,
    lead.smsStats?.total,
  ];

  const value = candidates.find((candidate) => candidate !== undefined && candidate !== null && candidate !== "");
  if (value === undefined) return 0;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0;
}

export function getLeadSmsRecords(lead) {
  if (!lead || typeof lead !== "object") return [];

  const sources = [
    lead.smsHistory,
    lead.smsDetails,
    lead.smsMessages,
    lead.messages,
    lead.sentMessages,
    lead.notifications,
    lead.smsTimeline,
    lead.smsRecords,
  ];

  const records = sources
    .flatMap((source) => {
      if (!source) return [];
      if (Array.isArray(source)) return source;
      if (typeof source === "object") return [source];
      return [];
    })
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const channel = String(item.channel ?? item.type ?? item.kind ?? "sms").toLowerCase();
      if (channel !== "sms" && channel !== "email") {
        return null;
      }
      const rawMessage = item.message ?? item.body ?? item.text ?? item.content ?? item.smsMessage ?? item.summary ?? "";
      return {
        id: item.id ?? item.uuid ?? item._id ?? `${item.createdAt ?? item.sentAt ?? item.timestamp ?? Date.now()}-${Math.random()}`,
        channel,
        message: typeof rawMessage === "string" ? rawMessage : JSON.stringify(rawMessage ?? ""),
        status: item.status ?? item.smsStatus ?? item.deliveryStatus ?? (item.sent === true ? "sent" : "unknown"),
        sentAt: item.sentAt ?? item.createdAt ?? item.timestamp ?? item.sent_at ?? item.date ?? item.deliveredAt,
        provider: item.provider ?? item.gateway ?? item.service,
      };
    })
    .filter(Boolean);

  if (records.length > 0) return records;

  const fallback = Array.isArray(lead.smsHistoryItems) ? lead.smsHistoryItems : [];
  return fallback.filter((item) => item && typeof item === "object");
}
