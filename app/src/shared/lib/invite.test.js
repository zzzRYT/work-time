import { describe, expect, it } from "bun:test";
import {
  INVITE_EXPIRES_IN_HOURS,
  buildInviteLink,
  extractInviteToken,
  getJoinWorkspaceErrorMessage,
} from "./invite.ts";

const TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("invite utilities", () => {
  it("uses a seven day invite window", () => {
    expect(INVITE_EXPIRES_IN_HOURS).toBe(168);
  });

  it("builds a join link with the app scheme", () => {
    expect(buildInviteLink(TOKEN)).toBe(`work-time://join?token=${TOKEN}`);
  });

  it("extracts a raw invite token", () => {
    expect(extractInviteToken(`  ${TOKEN}  `)).toBe(TOKEN);
  });

  it("extracts a token from the join link query parameter", () => {
    expect(extractInviteToken(`work-time://join?token=${TOKEN}`)).toBe(TOKEN);
  });

  it("extracts a token from the previous invite path format", () => {
    expect(extractInviteToken(`work-time://invite/${TOKEN}`)).toBe(TOKEN);
  });

  it("rejects invalid invite input", () => {
    expect(extractInviteToken("not-a-valid-token")).toBeNull();
    expect(extractInviteToken("")).toBeNull();
  });

  it("maps expected server errors to Korean messages", () => {
    expect(getJoinWorkspaceErrorMessage(new Error("Invite has expired"))).toBe(
      "만료된 초대입니다.",
    );
    expect(
      getJoinWorkspaceErrorMessage(
        new Error("Already a member of this workspace"),
      ),
    ).toBe("이미 참여 중인 워크스페이스입니다.");
    expect(getJoinWorkspaceErrorMessage(new Error("Invalid invite token"))).toBe(
      "초대 링크가 올바르지 않습니다.",
    );
  });
});
