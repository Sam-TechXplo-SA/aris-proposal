"use client";

import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { STATUS_META } from "@/lib/mock/status";
import type { ClaimStatus } from "@/lib/mock/types";
import { useState } from "react";

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  current: ClaimStatus;
  onSave: (status: ClaimStatus, note: string) => void;
}

// All 16 stages in workflow order — the manual override lets a broker pick any of them.
const STATUS_OPTIONS = (Object.keys(STATUS_META) as ClaimStatus[])
  .sort((a, b) => STATUS_META[a].order - STATUS_META[b].order)
  .map((s) => ({ value: s, label: STATUS_META[s].label }));

// Manual status override for brokers. Skips the tab-by-tab workflow checks, so a reason is required
// and recorded in the audit trail alongside the old and new status.
export default function ChangeStatusModal({ isOpen, onClose, current, onSave }: ChangeStatusModalProps) {
  const [status, setStatus] = useState<ClaimStatus>(current);
  const [note, setNote] = useState("");

  const canSave = status !== current && note.trim().length > 0;

  function close() {
    setStatus(current);
    setNote("");
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={close} className="max-w-md p-6">
      <h3 className="text-theme-lg font-semibold text-gray-800 dark:text-white/90">Change claim status</h3>
      <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
        Currently <span className="font-medium text-gray-800 dark:text-gray-200">{STATUS_META[current].label}</span>. The client sees the new status straight away.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <Label>New status</Label>
          <Select key={`${current}-${isOpen}`} options={STATUS_OPTIONS} defaultValue={current} onChange={(v) => setStatus(v as ClaimStatus)} />
        </div>
        <div>
          <Label>
            Reason for change <span className="text-error-500">*</span>
          </Label>
          <TextArea rows={3} value={note} onChange={setNote} placeholder="e.g. Insurer confirmed by phone that assessment is complete." />
          <p className="mt-1.5 text-theme-xs text-gray-400">
            Saved to the audit trail. Setting a status here skips the usual checks, such as the documents needed to close.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button size="sm" variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!canSave}
          onClick={() => {
            onSave(status, note.trim());
            close();
          }}
        >
          Save status
        </Button>
      </div>
    </Modal>
  );
}
