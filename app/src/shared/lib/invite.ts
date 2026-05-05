export const INVITE_EXPIRES_IN_HOURS = 168;
export const PENDING_INVITE_TOKEN_KEY = "@work-time/pending-invite-token";

const INVITE_TOKEN_PATTERN = /^[a-f0-9]{64}$/;

function normalizeToken(value: string | null | undefined) {
  const token = value?.trim() ?? "";
  return INVITE_TOKEN_PATTERN.test(token) ? token : null;
}

export function buildInviteLink(token: string, scheme = "work-time") {
  return `${scheme}:///join?token=${encodeURIComponent(token)}`;
}

export function extractInviteToken(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const queryToken = normalizeToken(url.searchParams.get("token"));
    if (queryToken) return queryToken;

    if (url.protocol === "work-time:" && url.hostname === "invite") {
      const pathSegments = url.pathname.split("/").filter(Boolean);
      const pathToken =
        pathSegments.length === 1 ? normalizeToken(pathSegments[0]) : null;
      if (pathToken) return pathToken;
    }
  } catch {
    return normalizeToken(trimmed);
  }

  return normalizeToken(trimmed);
}

export function getJoinWorkspaceErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("Invite has expired")) {
    return "만료된 초대입니다.";
  }

  if (message.includes("Already a member")) {
    return "이미 참여 중인 워크스페이스입니다.";
  }

  if (
    message.includes("Invalid invite token") ||
    message.includes("초대 링크가 올바르지 않습니다")
  ) {
    return "초대 링크가 올바르지 않습니다.";
  }

  return "워크스페이스 참여에 실패했습니다.";
}
