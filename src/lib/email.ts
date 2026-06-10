import { Resend } from "resend";

const FROM = process.env.RESEND_FROM || "TerraTrip <onboarding@resend.dev>";

export interface InviteEmailArgs {
  to: string;
  inviterName: string;
  tripName: string;
  role: string;
  link: string;
}

export interface SendResult {
  sent: boolean;
  reason?: string;
}

/**
 * Sends a collaborator-invite email via Resend.
 * Degrades gracefully: if RESEND_API_KEY isn't configured (or the send fails),
 * it returns { sent: false } instead of throwing, so the in-app invite still works.
 */
export async function sendInviteEmail(args: InviteEmailArgs): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: "email_not_configured" };

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: FROM,
      to: args.to,
      subject: `${args.inviterName} invited you to "${args.tripName}" on TerraTrip`,
      html: inviteHtml(args),
    });
    if (error) return { sent: false, reason: error.message };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "send_failed" };
  }
}

function inviteHtml({ inviterName, tripName, role, link }: InviteEmailArgs): string {
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#292524">
    <div style="text-align:center;margin-bottom:24px">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#f59e0b,#d97706);font-size:24px">🗺️</div>
      <h1 style="font-size:18px;margin:12px 0 0">TerraTrip</h1>
    </div>
    <div style="background:#fafaf9;border:1px solid #f5f5f4;border-radius:16px;padding:24px">
      <p style="margin:0 0 12px;font-size:15px"><strong>${escapeHtml(inviterName)}</strong> invited you to collaborate on the trip</p>
      <p style="margin:0 0 4px;font-size:20px;font-weight:700">${escapeHtml(tripName)}</p>
      <p style="margin:0 0 20px;font-size:13px;color:#78716c">Your role: <strong style="text-transform:capitalize">${escapeHtml(role)}</strong></p>
      <a href="${link}" style="display:inline-block;background:#d97706;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:12px">Open the trip →</a>
    </div>
    <p style="text-align:center;font-size:11px;color:#a8a29e;margin-top:20px">If you didn't expect this, you can ignore this email.</p>
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
