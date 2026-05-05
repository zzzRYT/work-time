import { describe, expect, it } from "bun:test";
import {
  INVITE_EXPIRES_IN_HOURS,
  PENDING_INVITE_TOKEN_KEY,
  buildInviteLink,
  extractInviteToken,
  getJoinWorkspaceErrorMessage,
} from "./invite.ts";

const TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const UPPERCASE_TOKEN = TOKEN.toUpperCase();

describe("invite utilities", () => {
  it("uses a seven day invite window", () => {
    expect(INVITE_EXPIRES_IN_HOURS).toBe(168);
  });

  it("uses the pending invite token storage key", () => {
    expect(PENDING_INVITE_TOKEN_KEY).toBe("@work-time/pending-invite-token");
  });

  it("builds an Expo Router join route link with the app scheme", () => {
    const link = buildInviteLink(TOKEN);
    const url = new URL(link);

    expect(link).toBe(`work-time:///join?token=${TOKEN}`);
    expect(url.hostname).toBe("");
    expect(url.pathname).toBe("/join");
  });

  it("extracts a raw invite token", () => {
    expect(extractInviteToken(`  ${TOKEN}  `)).toBe(TOKEN);
  });

  it("extracts a token from the join link query parameter", () => {
    expect(extractInviteToken(`work-time:///join?token=${TOKEN}`)).toBe(TOKEN);
  });

  it("extracts a token from the previous double slash join link query parameter", () => {
    expect(extractInviteToken(`work-time://join?token=${TOKEN}`)).toBe(TOKEN);
  });

  it("extracts a token from the previous invite path format", () => {
    expect(extractInviteToken(`work-time://invite/${TOKEN}`)).toBe(TOKEN);
  });

  it("rejects uppercase raw invite tokens", () => {
    expect(extractInviteToken(UPPERCASE_TOKEN)).toBeNull();
  });

  it("rejects uppercase invite tokens from the join link query parameter", () => {
    expect(
      extractInviteToken(`work-time://join?token=${UPPERCASE_TOKEN}`),
    ).toBeNull();
  });

  it("rejects uppercase invite tokens from the previous invite path format", () => {
    expect(
      extractInviteToken(`work-time://invite/${UPPERCASE_TOKEN}`),
    ).toBeNull();
  });

  it("rejects a token from an arbitrary URL path", () => {
    expect(extractInviteToken(`https://example.com/${TOKEN}`)).toBeNull();
  });

  it("rejects a token from a nested previous invite path", () => {
    expect(extractInviteToken(`work-time://invite/anything/${TOKEN}`)).toBeNull();
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
    expect(
      getJoinWorkspaceErrorMessage(new Error("초대 링크가 올바르지 않습니다.")),
    ).toBe("초대 링크가 올바르지 않습니다.");
    expect(getJoinWorkspaceErrorMessage(new Error("Unexpected error"))).toBe(
      "워크스페이스 참여에 실패했습니다.",
    );
  });
});
