import type {
  ActivityChangePatch,
  PositionChange,
  SessionChange
} from "@/api/srvf-activity-publish-review";
import type { AdminSimpleDraftResponseDto } from "@/api/srvf-simple-activity";

type Session = Pick<
  AdminSimpleDraftResponseDto["session"],
  | "startAt"
  | "endAt"
  | "checkInOpenAt"
  | "checkInCloseAt"
  | "checkOutOpenAt"
  | "checkOutCloseAt"
  | "preparationStartAt"
>;
type Position = Pick<
  AdminSimpleDraftResponseDto["position"],
  "startAt" | "endAt"
>;

// Simple keeps the template's offsets from the start (check-in) and end (check-out).
export function simpleChangeChildren(
  patch: ActivityChangePatch,
  session: Session,
  position: Position
) {
  const nextSession: SessionChange = {};
  const nextPosition: PositionChange = {};
  function shifted(value: string, from: string, to: string) {
    return new Date(
      Date.parse(value) + Date.parse(to) - Date.parse(from)
    ).toISOString();
  }
  if (patch.startAt !== undefined) {
    nextSession.startAt = patch.startAt;
    for (const key of [
      "checkInOpenAt",
      "checkInCloseAt",
      "preparationStartAt"
    ] as const) {
      const value = session[key];
      if (value !== null)
        nextSession[key] = shifted(value, session.startAt, patch.startAt);
    }
    if (position.startAt !== null) nextPosition.startAt = patch.startAt;
  }
  if (patch.endAt !== undefined) {
    nextSession.endAt = patch.endAt;
    for (const key of ["checkOutOpenAt", "checkOutCloseAt"] as const)
      nextSession[key] = shifted(session[key], session.endAt, patch.endAt);
    if (position.endAt !== null) nextPosition.endAt = patch.endAt;
  }
  if (patch.location !== undefined) nextSession.locationText = patch.location;
  if (patch.capacity !== undefined)
    nextSession.capacity = nextPosition.capacity = patch.capacity;
  return { session: nextSession, position: nextPosition };
}
