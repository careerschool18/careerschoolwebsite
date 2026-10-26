import { useEffect } from "react";
import { useRouter } from "next/router";
import { isLoggedIn } from "../../lib/crmAuth";

/**
 * CRM landing route: forwards an authenticated user to the leads dashboard (the entry point for
 * every role), or to the CRM login page when there is no session.
 */
export default function CrmIndex() {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/crm/login");
      return;
    }
    router.replace("/crm/leads");
  }, [router]);

  return (
    <div className="min-h-screen bg-blue-50 flex justify-center items-center font-semibold text-blue-800">
      Opening CRM...
    </div>
  );
}

