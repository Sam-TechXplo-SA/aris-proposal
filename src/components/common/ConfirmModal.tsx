"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: "brand" | "error";
}

// Shared confirmation gate for irreversible-by-normal-means actions (recording an
// insurer decision, closing/reopening a claim) — per ux-blueprint.md §3.4/§5.
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "brand",
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <h3 className="text-theme-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
      <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button size="sm" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={tone === "error" ? "bg-error-500! hover:bg-error-600!" : undefined}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
