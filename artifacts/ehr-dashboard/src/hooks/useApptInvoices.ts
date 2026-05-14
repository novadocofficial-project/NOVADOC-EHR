import { useState, useCallback } from "react";
import type { ReceiptInfo } from "@/pages/FrontDeskUser";

const LS_KEY = "ehr-appt-invoices";

function load(): Record<string, ReceiptInfo> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ReceiptInfo>) : {};
  } catch { return {}; }
}

function save(data: Record<string, ReceiptInfo>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* noop */ }
}

export function useApptInvoices() {
  const [invoices, setInvoices] = useState<Record<string, ReceiptInfo>>(load);

  const saveInvoice = useCallback((apptId: string, receipt: ReceiptInfo) => {
    setInvoices(prev => {
      const next = { ...prev, [apptId]: receipt };
      save(next);
      return next;
    });
  }, []);

  const paidIds = new Set(Object.keys(invoices));

  return { invoices, saveInvoice, paidIds };
}
