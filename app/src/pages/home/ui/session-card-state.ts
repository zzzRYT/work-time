export type SessionCardButtonState = "idle" | "studying" | "completed";
export type PendingSessionAction = "checkin" | "checkout" | null | undefined;

type SessionCardStateInput = {
  status: string;
  checkInTime: string | null;
  pendingAction: PendingSessionAction;
  optimisticCheckInTime: string | null | undefined;
};

type SessionCardState = {
  effectiveStatus: string;
  timerCheckInTime: string | null;
  isStudying: boolean;
  buttonState: SessionCardButtonState;
};

export function getSessionCardState({
  status,
  checkInTime,
  pendingAction,
  optimisticCheckInTime,
}: SessionCardStateInput): SessionCardState {
  const effectiveStatus =
    pendingAction === "checkin"
      ? "STUDYING"
      : pendingAction === "checkout"
        ? "COMPLETED"
        : status;
  const timerCheckInTime =
    pendingAction === "checkin"
      ? (optimisticCheckInTime ?? null)
      : pendingAction === "checkout"
        ? null
        : checkInTime;
  const isStudying =
    effectiveStatus === "STUDYING" ||
    (effectiveStatus === "LATE" && timerCheckInTime != null);

  return {
    effectiveStatus,
    timerCheckInTime,
    isStudying,
    buttonState: getButtonState(effectiveStatus, isStudying),
  };
}

function getButtonState(
  status: string,
  isStudying: boolean,
): SessionCardButtonState {
  if (isStudying) {
    return "studying";
  }

  if (status === "COMPLETED" || status === "LATE") {
    return "completed";
  }

  return "idle";
}
