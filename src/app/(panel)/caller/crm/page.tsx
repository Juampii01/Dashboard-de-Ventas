import { redirect } from "next/navigation";

// Paso H7 (Cristian, 10 oct 2026): un solo CRM para todos. La dirección antigua lleva al CRM nuevo.
export default function CrmCallerPage() {
  redirect("/crm");
}
