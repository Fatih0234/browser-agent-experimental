import { redirect } from "next/navigation";

export default function DashboardRootPage() {
  // Redirect to a default state - the OrgProvider will handle org selection
  redirect("/dashboard/select-org");
}
