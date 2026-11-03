import SearchBar from "./SearchBar";
import { assets } from "../assets/assets";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleDown,
  faBarsStaggered,
  faBell,
  faCheck,
  faMessage,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import { apiClient } from "../lib/apiClient";

const formatMessageTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const isConversationMessage = (message) => {
  const type = String(message.messageType || "").toLowerCase();
  return (
    type.includes("message") ||
    type.includes("contact") ||
    type.includes("chat") ||
    type.includes("conversation")
  );
};

const messageKind = (message) =>
  isConversationMessage(message) ? "conversation" : "notification";

const MARK_SEEN_DELAY_MS = 3000;
const MARK_SEEN_MAX_IDS = 500;

// Mounted only while a panel is open (PopoverPanel unmounts on close), so the
// timer starts on open and is cancelled if the panel closes first.
const MarkSeenOnOpen = ({ items, kind, onMarkSeenByIds }) => {
  const itemsRef = useRef(items);
  const handlerRef = useRef(onMarkSeenByIds);
  useEffect(() => {
    itemsRef.current = items;
    handlerRef.current = onMarkSeenByIds;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      // The message panel can fall back to showing every message, so only
      // send ids of this panel's own kind.
      const ids = itemsRef.current
        .filter((item) => !item.seen && messageKind(item) === kind)
        .map((item) => item.id)
        .slice(0, MARK_SEEN_MAX_IDS);
      // Never send an empty list: the backend would mark every unseen message.
      if (ids.length) handlerRef.current(ids, kind);
    }, MARK_SEEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [kind]);

  return null;
};

const NotificationPanel = ({
  title,
  emptyText,
  items,
  unreadCount,
  loading,
  onMarkSeen,
  onMarkAllSeen,
}) => (
  <div className="w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_14px_36px_rgba(16,24,40,0.14)]">
    <div className="flex items-center justify-between border-b border-[#eef2f6] px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-[#101828]">{title}</p>
        <p className="text-xs text-[#667085]">{unreadCount} unread</p>
      </div>
      <button
        type="button"
        onClick={onMarkAllSeen}
        disabled={!unreadCount}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-[#008f45] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FontAwesomeIcon icon={faCheck} />
        Mark all read
      </button>
    </div>

    <div className="max-h-[360px] overflow-y-auto py-1">
      {loading ? (
        <div className="px-4 py-8 text-center text-sm text-[#667085]">
          Loading...
        </div>
      ) : items.length ? (
        items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onMarkSeen(item)}
            className="flex w-full gap-3 border-b border-[#f2f4f7] px-4 py-3 text-left last:border-0 hover:bg-[#f9fafb]"
          >
            <span
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                item.seen ? "bg-[#d0d5dd]" : "bg-[#ef3340]"
              }`}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-[#101828]">
                {item.messageType || "Notification"}
              </span>
              <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[#475467]">
                {item.message || "No message body available."}
              </span>
              <span className="mt-1 block text-[11px] text-[#98a2b3]">
                {formatMessageTime(item.createdAt)}
              </span>
            </span>
          </button>
        ))
      ) : (
        <div className="px-4 py-8 text-center text-sm text-[#667085]">
          {emptyText}
        </div>
      )}
    </div>
  </div>
);

function Navbar() {
  const { user: profileData = {}, logout, toggleSidebar, token, web_socket_url } = useContext(ShopContext);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [unseenCounts, setUnseenCounts] = useState({ notification: 0, conversation: 0 });
  const displayName =
    profileData.username ||
    `${profileData.lastname || ""} ${profileData.firstname || ""}`.trim() ||
    "Administrator";

  const fetchUnseenCount = useCallback(async () => {
    if (!token) return;

    try {
      const [notification, conversation] = await Promise.all(
        ["notification", "conversation"].map((kind) =>
          apiClient.get("/message/unseen/count", { params: { kind } })
        )
      );
      setUnseenCounts({
        notification: Number(notification.data?.unseen) || 0,
        conversation: Number(conversation.data?.unseen) || 0,
      });
    } catch {
      // Badge is best-effort; keep the last known count.
    }
  }, [token]);

  const fetchMessages = useCallback(async () => {
    if (!token) return;
    fetchUnseenCount();

    try {
      setMessagesLoading(true);
      const response = await apiClient.get("/message", {
        params: {
          page: 1,
          limit: 20,
          sortBy: "createdAt:DESC",
        },
      });
      setMessages(response.data?.data || []);
    } catch (error) {
      toast.error(error.message || "Unable to load notifications.");
    } finally {
      setMessagesLoading(false);
    }
  }, [fetchUnseenCount, token]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Notifications live on their own namespace, separate from the shared
  // socket that carries upload progress.
  useEffect(() => {
    if (!token || !web_socket_url) return undefined;

    const socket = io(`${web_socket_url.replace(/\/$/, "")}/notifications`, {
      auth: { token },
      transports: ["websocket"],
    });
    const refresh = () => fetchMessages();
    socket.on("notification", refresh);
    socket.on("message", refresh);

    return () => {
      socket.off("notification", refresh);
      socket.off("message", refresh);
      socket.disconnect();
    };
  }, [fetchMessages, token, web_socket_url]);

  // Fallback for a dropped socket: catch up when the admin returns to the tab.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") fetchMessages();
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [fetchMessages]);

  const { notificationItems, messageItems } = useMemo(() => {
    const conversations = messages.filter(isConversationMessage);
    const notifications = messages.filter((message) => !isConversationMessage(message));
    return {
      notificationItems: notifications,
      messageItems: conversations.length ? conversations : messages,
    };
  }, [messages]);

  // Server-side unseen counts drive the badges (not limited to the 20 loaded
  // messages).
  const unreadNotifications = unseenCounts.notification;
  const unreadMessages = unseenCounts.conversation;

  const markSeenByIds = async (ids, kind) => {
    try {
      await apiClient.patch("/message/seen", { ids, kind });
      const seenIds = new Set(ids);
      setMessages((current) =>
        current.map((message) =>
          seenIds.has(message.id) && messageKind(message) === kind
            ? { ...message, seen: true }
            : message
        )
      );
      fetchUnseenCount();
    } catch {
      // Background action: stay quiet and leave messages unread for next open.
    }
  };

  const markSeen = async (item) => {
    if (!item || item.seen) return;

    try {
      await apiClient.put(`/message/${item.id}`, { seen: true });
      setMessages((current) =>
        current.map((message) =>
          message.id === item.id ? { ...message, seen: true } : message
        )
      );
      fetchUnseenCount();
    } catch (error) {
      toast.error(error.message || "Unable to update message.");
    }
  };

  const markAllSeen = async (items) => {
    const unread = items.filter((item) => !item.seen);
    if (!unread.length) return;

    try {
      await Promise.all(
        unread.map((item) => apiClient.put(`/message/${item.id}`, { seen: true }))
      );
      const unreadIds = new Set(unread.map((item) => item.id));
      setMessages((current) =>
        current.map((message) =>
          unreadIds.has(message.id) ? { ...message, seen: true } : message
        )
      );
      fetchUnseenCount();
    } catch (error) {
      toast.error(error.message || "Unable to mark messages as read.");
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button
          type="button"
          onClick={toggleSidebar}
          className="grid h-9 w-9 place-items-center rounded-md border border-gray-200 md:hidden"
          aria-label="Open sidebar"
        >
          <FontAwesomeIcon
            icon={faBarsStaggered}
            className="cursor-pointer text-[#111827]"
          />
        </button>
        <SearchBar />
      </div>

      <div className="ml-4 flex items-center gap-4">
        <Popover>
          <PopoverButton
            className="relative grid h-9 w-9 place-items-center rounded-full text-[#111827] hover:bg-gray-50"
            aria-label="Notifications"
          >
            <FontAwesomeIcon icon={faBell} />
            {unreadNotifications > 0 && (
              <span className="absolute right-1 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-[#ef3340] px-1 text-[10px] font-semibold text-white">
                {unreadNotifications}
              </span>
            )}
          </PopoverButton>
          <PopoverPanel transition anchor="bottom end" className="z-50 mt-2">
            <MarkSeenOnOpen items={notificationItems} kind="notification" onMarkSeenByIds={markSeenByIds} />
            <NotificationPanel
              title="Notifications"
              emptyText="No notifications yet"
              items={notificationItems}
              unreadCount={unreadNotifications}
              loading={messagesLoading}
              onMarkSeen={markSeen}
              onMarkAllSeen={() => markAllSeen(notificationItems)}
            />
          </PopoverPanel>
        </Popover>

        <Popover>
          <PopoverButton
            className="relative grid h-9 w-9 place-items-center rounded-full text-[#111827] hover:bg-gray-50"
            aria-label="Messages"
          >
            <FontAwesomeIcon icon={faMessage} />
            {unreadMessages > 0 && (
              <span className="absolute right-1 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-[#ef3340] px-1 text-[10px] font-semibold text-white">
                {unreadMessages}
              </span>
            )}
          </PopoverButton>
          <PopoverPanel transition anchor="bottom end" className="z-50 mt-2">
            <MarkSeenOnOpen items={messageItems} kind="conversation" onMarkSeenByIds={markSeenByIds} />
            <NotificationPanel
              title="Messages"
              emptyText="No messages yet"
              items={messageItems}
              unreadCount={unreadMessages}
              loading={messagesLoading}
              onMarkSeen={markSeen}
              onMarkAllSeen={() => markAllSeen(messageItems)}
            />
          </PopoverPanel>
        </Popover>
        <Popover>
          <PopoverButton className="flex cursor-pointer flex-row items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full border border-gray-100">
              <img
                src={assets.profile_picture}
                className="h-full w-full object-cover"
                alt=""
              />
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-[#111827]">{displayName}</p>
              <p className="text-xs font-medium text-[#667085]">Administrator</p>
            </div>
            <FontAwesomeIcon icon={faAngleDown} className="hidden text-xs sm:block" />
          </PopoverButton>
          <PopoverPanel
            transition
            anchor="bottom"
            className="divide-y divide-white/5 rounded-xl bg-white text-sm/6 transition duration-200 ease-in-out [--anchor-gap:var(--spacing-5)] data-[closed]:-translate-y-1 data-[closed]:opacity-0"
          >
            <div className="p-3">
              <button
                type="button"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </PopoverPanel>
        </Popover>
      </div>
    </header>
  );
}

export default Navbar;
