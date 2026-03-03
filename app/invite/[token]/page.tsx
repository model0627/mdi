import { notFound } from "next/navigation";
import InvitePageClient from "./InvitePageClient";
import fs from "fs";
import path from "path";

interface InviteData {
  token: string;
  memberId: string;
  memberName: string;
  role: string;
  createdBy: string;
  expiresAt: string;
  used: boolean;
  expired: boolean;
}

interface StoredInvite {
  token: string;
  memberId: string;
  memberName: string;
  initials: string;
  role: string;
  avatarColor: number;
  status: string;
  createdAt: string;
  expiresAt: string;
}

// Decode self-contained base64url token (Vercel-compatible, no storage needed)
function tryDecodeToken(token: string): InviteData | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
    if (decoded.v === 1 && decoded.memberId && decoded.expiresAt) {
      return {
        token,
        memberId: decoded.memberId,
        memberName: decoded.memberName,
        role: decoded.role,
        createdBy: "",
        expiresAt: decoded.expiresAt,
        used: false,
        expired: new Date(decoded.expiresAt) < new Date(),
      };
    }
  } catch { /* not a base64url token */ }
  return null;
}

// Fallback: read from local file system (legacy hex tokens)
function readInviteFile(token: string): InviteData | null {
  const IS_VERCEL = process.env.VERCEL === "1";
  const INVITES_DIR = IS_VERCEL
    ? "/tmp/mdi/invites"
    : path.join(process.cwd(), "data", "invites");
  const filePath = path.join(INVITES_DIR, `${token}.json`);
  try {
    if (!fs.existsSync(filePath)) return null;
    const inv = JSON.parse(fs.readFileSync(filePath, "utf-8")) as StoredInvite;
    return {
      token: inv.token,
      memberId: inv.memberId,
      memberName: inv.memberName,
      role: inv.role,
      createdBy: "",
      expiresAt: inv.expiresAt,
      used: inv.status === "used",
      expired: inv.status === "expired" || new Date(inv.expiresAt) < new Date(),
    };
  } catch {
    return null;
  }
}

function getInvite(token: string): InviteData | null {
  return tryDecodeToken(token) ?? readInviteFile(token);
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = getInvite(token);

  if (!invite) {
    notFound();
  }

  if (invite.expired || invite.used) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: "var(--color-bg-base)" }}
      >
        <div
          className="rounded-2xl flex flex-col items-center gap-4 text-center"
          style={{
            maxWidth: 400,
            width: "100%",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-bg-border)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
            padding: "48px 40px",
          }}
        >
          <span style={{ fontSize: 40 }}>❌</span>
          <p style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>
            {invite.used
              ? "이미 사용된 링크입니다"
              : "초대 링크가 만료되었습니다"}
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            새로운 초대 링크를 요청해주세요.
          </p>
        </div>
      </div>
    );
  }

  return <InvitePageClient invite={invite} />;
}
