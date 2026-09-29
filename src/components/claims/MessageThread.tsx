"use client";

import Button from "@/components/ui/button/Button";
import TextArea from "@/components/form/input/TextArea";
import { useAuth } from "@/context/AuthContext";
import { findUser, formatDateTime } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import type { Role } from "@/lib/mock/types";
import { useState } from "react";

interface ThreadEntry {
  id: string;
  authorId: string;
  authorRole: Role;
  body: string;
  createdAt: string;
}

interface MessageThreadProps {
  claimId: string;
  entries: ThreadEntry[];
  onSubmit: (body: string) => void;
  placeholder: string;
  emptyMessage: string;
}

export default function MessageThread({ entries, onSubmit, placeholder, emptyMessage }: MessageThreadProps) {
  const { state } = useData();
  const { currentUser } = useAuth();
  const [body, setBody] = useState("");

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        ) : (
          entries.map((entry) => {
            const author = findUser(state, entry.authorId);
            const isMine = entry.authorId === currentUser?.id;
            return (
              <div key={entry.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-md rounded-xl px-4 py-2.5 ${isMine ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300"}`}>
                  <p className="text-theme-sm">{entry.body}</p>
                  <p className={`mt-1 text-theme-xs ${isMine ? "text-white/70" : "text-gray-400"}`}>
                    {author?.name ?? "Unknown"} · {formatDateTime(entry.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <TextArea rows={2} placeholder={placeholder} value={body} onChange={setBody} />
        </div>
        <Button
          size="sm"
          disabled={!body.trim()}
          onClick={() => {
            onSubmit(body.trim());
            setBody("");
          }}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
