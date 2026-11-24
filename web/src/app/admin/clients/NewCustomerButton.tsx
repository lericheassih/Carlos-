"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CustomerForm } from "./CustomerForm";

export function NewCustomerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}><Plus className="size-4" /> Ajouter un client</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau client">
        <CustomerForm id={null} initial={{ full_name: "", phone: "", whatsapp: "", email: "", country: "", notes: "" }} />
      </Modal>
    </>
  );
}
