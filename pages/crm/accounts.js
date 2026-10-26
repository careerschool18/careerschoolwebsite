import React from "react";
import CrmLayout from "../../components/crm/CrmLayout";
import AccountsPanel from "../../components/crm/AccountsPanel";
import { ROLES } from "../../lib/crmAuth";

/**
 * Accounts dashboard — super admin + admin only. The layout guards the route: an employee
 * (or anyone without the role) is redirected to /crm/leads.
 */
export default function CrmAccountsPage() {
  return (
    <CrmLayout title="Accounts" allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
      <AccountsPanel />
    </CrmLayout>
  );
}
