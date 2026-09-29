"use client";

import AdministratorOnly from "@/components/auth/AdministratorOnly";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { useData } from "@/lib/mock/store";
import type { Role } from "@/lib/mock/types";
import { useState } from "react";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "broker", label: "Broker" },
  { value: "manager", label: "Manager" },
  { value: "administrator", label: "Administrator" },
  { value: "client_primary", label: "Client — Primary Contact" },
  { value: "client_secondary", label: "Client — Secondary Contact" },
];

export default function NewUserPage() {
  const { currentUser } = useAuth();
  const { state, addUser } = useData();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("broker");
  const [clientId, setClientId] = useState(state.clients[0]?.id ?? "");
  const [error, setError] = useState("");

  if (!currentUser) return null;
  const isClientRole = role === "client_primary" || role === "client_secondary";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) return;
    if (isClientRole) {
      const existing = state.users.filter((u) => u.clientId === clientId && (u.role === "client_primary" || u.role === "client_secondary"));
      if (existing.length >= 2) {
        setError("This client already has 2 contacts (Q-009's cap) — deactivate one before adding another.");
        return;
      }
    }
    addUser({ user: { name, email, role, clientId: isClientRole ? clientId : undefined }, actorId: currentUser!.id, actorRole: currentUser!.role });
    router.push("/users");
  }

  return (
    <AdministratorOnly>
      <PageBreadcrumb pageTitle="New User" />
      <form onSubmit={handleSubmit} className="max-w-xl">
        <ComponentCard title="Account Details">
          <div className="space-y-5">
            <div>
              <Label>
                Name <span className="text-error-500">*</span>
              </Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>
                Email <span className="text-error-500">*</span>
              </Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Role</Label>
              <Select options={ROLE_OPTIONS} defaultValue={role} onChange={(v) => setRole(v as Role)} />
            </div>
            {isClientRole && (
              <div>
                <Label>Client Organisation</Label>
                <Select options={state.clients.map((c) => ({ value: c.id, label: c.name }))} defaultValue={clientId} onChange={setClientId} />
              </div>
            )}
            {error && <p className="text-theme-sm text-error-500">{error}</p>}
            <Button size="sm">Create User &amp; Send MFA Invitation</Button>
          </div>
        </ComponentCard>
      </form>
    </AdministratorOnly>
  );
}
