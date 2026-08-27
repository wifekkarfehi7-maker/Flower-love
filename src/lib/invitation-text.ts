/**
 * Auto-generates the classic Arabic invitation announcement from couple
 * info. The builder (Phase 4) will let users regenerate or fully overwrite
 * this — the invitation's `invitationText` field always stays editable.
 */
export function generateInvitationText({
  groomName,
  brideName,
  groomFather,
  brideFather,
}: {
  groomName: string;
  brideName: string;
  groomFather?: string;
  brideFather?: string;
}): string {
  const fathers = [groomFather, brideFather].filter(Boolean);
  const familyLine =
    fathers.length === 2
      ? `تتشرف عائلة السيد ${groomFather}\nوالسيد ${brideFather}`
      : fathers.length === 1
        ? `تتشرف عائلة السيد ${fathers[0]}`
        : "يتشرف العروسان";

  return `${familyLine}\nبدعوتكم لحضور حفل زفاف\n${groomName} و${brideName}`;
}
