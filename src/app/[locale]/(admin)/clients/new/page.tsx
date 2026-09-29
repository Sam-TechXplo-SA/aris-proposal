"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { useData } from "@/lib/mock/store";
import { useState } from "react";

export default function NewClientPage() {
  const { currentUser } = useAuth();
  const { state, addClient } = useData();
  const router = useRouter();
  const brokers = state.users.filter((u) => u.role === "broker");

  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [address, setAddress] = useState("");
  const [brokerId, setBrokerId] = useState(brokers[0]?.id ?? "");
  const [primaryName, setPrimaryName] = useState("");
  const [primaryEmail, setPrimaryEmail] = useState("");

  if (!currentUser) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !brokerId || !primaryName || !primaryEmail) return;
    addClient({
      client: { name, regNo, address, brokerId },
      primaryContact: { name: primaryName, email: primaryEmail },
      actorId: currentUser!.id,
      actorRole: currentUser!.role,
    });
    router.push("/clients");
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="New Client" />
      <form onSubmit={handleSubmit} className="max-w-xl">
        <ComponentCard title="Organisation">
          <div className="space-y-5">
            <div>
              <Label>
                Client Name <span className="text-error-500">*</span>
              </Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Registration Number</Label>
              <Input value={regNo} onChange={(e) => setRegNo(e.target.value)} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div>
              <Label>
                Assigned Broker <span className="text-error-500">*</span>
              </Label>
              <Select options={brokers.map((b) => ({ value: b.id, label: b.name }))} defaultValue={brokerId} onChange={setBrokerId} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>
                  Primary Contact Name <span className="text-error-500">*</span>
                </Label>
                <Input value={primaryName} onChange={(e) => setPrimaryName(e.target.value)} />
              </div>
              <div>
                <Label>
                  Primary Contact Email <span className="text-error-500">*</span>
                </Label>
                <Input type="email" value={primaryEmail} onChange={(e) => setPrimaryEmail(e.target.value)} />
              </div>
            </div>
            <Button size="sm">Create Client</Button>
          </div>
        </ComponentCard>
      </form>
    </div>
  );
}
