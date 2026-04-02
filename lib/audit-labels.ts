export const actionLabels: Record<string, string> = {
  sign_in: "Signed In",
  sign_out: "Signed Out",
  org_switch: "Switched Organization",
  org_create: "Created Organization",
  case_create: "Created Case",
  case_update: "Updated Case",
  case_status_change: "Changed Case Status",
  case_delete: "Deleted Case",
  document_upload: "Uploaded Document",
  document_version_upload: "Uploaded Document Version",
  document_delete: "Deleted Document",
  scenario_seed: "Seeded Scenario",
  scenario_reset: "Reset Scenario",
  admin_action: "Admin Action",
};

export function getActionLabel(action: string): string {
  return actionLabels[action] || action.replace(/_/g, " ");
}
