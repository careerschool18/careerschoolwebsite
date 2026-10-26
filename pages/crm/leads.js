import React from "react";
import CrmLayout from "../../components/crm/CrmLayout";
import LeadsPanel from "../../components/crm/LeadsPanel";

/** Leads dashboard — served to all three roles. Content is scoped by the backend (employee sees only assigned). */
export default function CrmLeadsPage() {
  return (
    <CrmLayout title="Leads">
      <LeadsPanel />
    </CrmLayout>
  );
}
