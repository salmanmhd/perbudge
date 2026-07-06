import type { FinancialSnapshot } from "@/lib/actions/finance-snapshot";
import { formatINR } from "@/lib/finance";
import { getCategoryEmoji } from "@/lib/categories";

/** Very small, safe markdown → HTML for the AI digest text. */
function digestToHtml(md: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = md.split("\n").map((l) => l.trim()).filter(Boolean);
  const out: string[] = [];
  let inList = false;
  for (let raw of lines) {
    let line = esc(raw).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    const isBullet = /^[-*•]\s+/.test(raw);
    if (isBullet) {
      if (!inList) {
        out.push('<ul style="margin:8px 0;padding-left:20px;">');
        inList = true;
      }
      line = line.replace(/^[-*•]\s+/, "");
      out.push(`<li style="margin:4px 0;color:#3f3f46;">${line}</li>`);
    } else {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<p style="margin:8px 0;color:#3f3f46;line-height:1.6;">${line}</p>`);
    }
  }
  if (inList) out.push("</ul>");
  return out.join("");
}

function statCell(label: string, value: string, color = "#18181b"): string {
  return `
    <td style="padding:14px 16px;background:#fafaf9;border-radius:12px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#71717a;font-weight:600;">${label}</div>
      <div style="font-size:20px;font-weight:700;color:${color};margin-top:4px;font-family:'JetBrains Mono',monospace;">${value}</div>
    </td>`;
}

export function renderWeeklyReportEmail(
  snapshot: FinancialSnapshot,
  digest: string,
  appUrl: string
): { subject: string; html: string } {
  const s = snapshot;
  const savingsRate =
    s.monthlyIncome > 0
      ? Math.round(((s.monthlyIncome - s.monthExpense) / s.monthlyIncome) * 100)
      : null;

  const subject = `Your Kharcha weekly report — ${formatINR(s.monthExpense)} spent this month`;

  const topCategories = s.categorySpend
    .slice(0, 4)
    .map(
      (c) => `
      <tr>
        <td style="padding:8px 0;color:#3f3f46;font-size:14px;text-transform:capitalize;">
          ${getCategoryEmoji(c.category)} ${c.category}
        </td>
        <td style="padding:8px 0;color:#18181b;font-size:14px;font-weight:600;text-align:right;font-family:'JetBrains Mono',monospace;">
          ${formatINR(c.amount)}
        </td>
      </tr>`
    )
    .join("");

  const emiRow = s.monthlyEmiTotal
    ? `<tr>${statCell("Monthly EMIs", formatINR(s.monthlyEmiTotal), "#b45309")}${
        s.receivable
          ? statCell("Owed to you", formatINR(s.receivable), "#059669")
          : statCell("You owe", formatINR(s.payable), "#dc2626")
      }</tr>`
    : "";

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:#0f766e;padding:28px 28px 24px;">
              <div style="display:inline-block;width:32px;height:32px;background:rgba(255,255,255,0.18);border-radius:8px;text-align:center;line-height:32px;color:#fff;font-weight:700;font-size:16px;">₹</div>
              <div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:14px;">Hi ${s.displayName}, here's your week in money</div>
              <div style="color:#ffffff;font-size:22px;font-weight:700;margin-top:2px;">Weekly Report</div>
            </td>
          </tr>

          <!-- Stats -->
          <tr>
            <td style="padding:24px 28px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="8">
                <tr>
                  ${statCell("Spent this month", formatINR(s.monthExpense))}
                  ${
                    savingsRate !== null
                      ? statCell(
                          "Savings rate",
                          `${savingsRate}%`,
                          savingsRate >= s.savingsTargetPct ? "#059669" : "#b45309"
                        )
                      : statCell("Income logged", formatINR(s.monthIncome))
                  }
                </tr>
                ${emiRow}
              </table>
            </td>
          </tr>

          <!-- AI Digest -->
          <tr>
            <td style="padding:16px 28px;">
              <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:14px;padding:18px 20px;">
                <div style="font-size:13px;font-weight:700;color:#0f766e;margin-bottom:6px;">✦ Your AI digest</div>
                ${digestToHtml(digest)}
              </div>
            </td>
          </tr>

          ${
            topCategories
              ? `<tr>
            <td style="padding:8px 28px 16px;">
              <div style="font-size:13px;font-weight:700;color:#18181b;margin-bottom:6px;">Where money went</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${topCategories}</table>
            </td>
          </tr>`
              : ""
          }

          <!-- CTA -->
          <tr>
            <td style="padding:8px 28px 28px;">
              <a href="${appUrl}/dashboard/insights" style="display:block;background:#0f766e;color:#ffffff;text-decoration:none;text-align:center;padding:14px;border-radius:12px;font-weight:600;font-size:15px;">
                Open full insights →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 28px 28px;text-align:center;">
              <div style="font-size:12px;color:#a1a1aa;line-height:1.6;">
                Kharcha · calmer money decisions.<br/>
                You can turn off weekly reports anytime in Settings.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
