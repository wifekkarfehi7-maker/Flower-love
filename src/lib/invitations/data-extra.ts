import type { InvitationDataExtra } from "@/types/invitation";
import type { InvitationRow } from "@/types/database";

export function getInvitationExtra(row: Pick<InvitationRow, "data">): InvitationDataExtra {
  return (row.data ?? {}) as InvitationDataExtra;
}

export function withInvitationExtra(
  row: Pick<InvitationRow, "data">,
  patch: Partial<InvitationDataExtra>
): Record<string, unknown> {
  return { ...getInvitationExtra(row), ...patch };
}
