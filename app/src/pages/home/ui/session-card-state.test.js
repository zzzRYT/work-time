import { describe, expect, it } from "bun:test";
import { getSessionCardState } from "./session-card-state.ts";

describe("getSessionCardState", () => {
  const defaultInput = {
    checkInTime: null,
    pendingAction: null,
    optimisticCheckInTime: null,
  };

  [
    {
      name: "keeps a not-attended session idle",
      input: {
        ...defaultInput,
        status: "NOT_ATTENDED",
      },
      expected: {
        effectiveStatus: "NOT_ATTENDED",
        isStudying: false,
        buttonState: "idle",
        timerCheckInTime: null,
      },
    },
    {
      name: "keeps a completed session ready for another check-in",
      input: {
        ...defaultInput,
        status: "COMPLETED",
      },
      expected: {
        effectiveStatus: "COMPLETED",
        isStudying: false,
        buttonState: "completed",
        timerCheckInTime: null,
      },
    },
    {
      name: "keeps a late session without an active timer completed",
      input: {
        ...defaultInput,
        status: "LATE",
      },
      expected: {
        effectiveStatus: "LATE",
        isStudying: false,
        buttonState: "completed",
        timerCheckInTime: null,
      },
    },
    {
      name: "uses optimistic check-in state while check-in is pending",
      input: {
        ...defaultInput,
        status: "NOT_ATTENDED",
        pendingAction: "checkin",
        optimisticCheckInTime: "2026-05-14T01:00:00.000Z",
      },
      expected: {
        effectiveStatus: "STUDYING",
        isStudying: true,
        buttonState: "studying",
        timerCheckInTime: "2026-05-14T01:00:00.000Z",
      },
    },
    {
      name: "uses completed state while checkout is pending",
      input: {
        ...defaultInput,
        status: "STUDYING",
        checkInTime: "2026-05-14T01:00:00.000Z",
        pendingAction: "checkout",
      },
      expected: {
        effectiveStatus: "COMPLETED",
        isStudying: false,
        buttonState: "completed",
        timerCheckInTime: null,
      },
    },
  ].forEach(({ name, input, expected }) => {
    it(name, () => {
      expect(getSessionCardState(input)).toEqual(expected);
    });
  });

  it("treats a late active session as studying so the user can check out", () => {
    const state = getSessionCardState({
      status: "LATE",
      checkInTime: "2026-05-14T01:30:00.000Z",
      pendingAction: null,
      optimisticCheckInTime: null,
    });

    expect(state.isStudying).toBe(true);
    expect(state.buttonState).toBe("studying");
    expect(state.timerCheckInTime).toBe("2026-05-14T01:30:00.000Z");
  });
});
