import { notFound } from "next/navigation";
import InvitePageClient from "./InvitePageClient";

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

async function getInvite(token: string): Promise<InviteData | null> {
  try {
    const res = await fetch(`http://192.168.130.36:3001/api/invites/${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInvite(token);

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
