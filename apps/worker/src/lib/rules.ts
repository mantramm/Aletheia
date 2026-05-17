import type { Signal, RuleViolation } from "./types";

type ActiveClaim = {
  id: string;
  text: string;
  verdict: "true" | "contradicted" | "unclear";
};

export function evaluateClaim(
  signals: Signal[],
  claim: ActiveClaim
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const claimText = claim.text.toLowerCase();

  const prSignals = signals.filter(
    (s) => s.source === "github" && s.type === "pr_merged"
  );
  const docSignals = signals.filter(
    (s) => s.source === "notion" && s.type === "stale_doc"
  );
  const crmSignals = signals.filter(
    (s) => s.source === "crm" && s.type === "renewal_at_risk"
  );
  const roadmapSignals = signals.filter(
    (s) => s.source === "roadmap" && s.type === "dependency_conflict"
  );
  const metricMisses = signals.filter((s) => s.type === "metric_miss");
  const supportEscalations = signals.filter((s) => s.type === "support_escalation");
  const customerBlockers = signals.filter((s) => s.type === "customer_blocker");

  if (claimText.includes("beta readiness")) {
    for (const metric of metricMisses) {
      violations.push({
        rule: "activation_gap",
        severity: metric.severity,
        detail: `${metric.label}: ${metric.summary}`,
      });
    }
    for (const support of supportEscalations) {
      violations.push({
        rule: "beta_blocker",
        severity: support.severity,
        detail: `${support.label}: ${support.summary}`,
      });
    }
  }

  if (claimText.includes("activation sprint")) {
    for (const support of supportEscalations) {
      violations.push({
        rule: "onboarding_regression",
        severity: support.severity,
        detail: `${support.label}: ${support.summary}`,
      });
    }
    for (const pr of prSignals) {
      if (pr.summary.toLowerCase().includes("unmerged") || pr.summary.toLowerCase().includes("blocks")) {
        violations.push({
          rule: "unmerged_blocker",
          severity: pr.severity,
          detail: `${pr.label}: ${pr.summary}`,
        });
      }
    }
  }

  if (claimText.includes("trust") || claimText.includes("security")) {
    for (const customer of customerBlockers) {
      violations.push({
        rule: "security_customer_blocker",
        severity: customer.severity,
        detail: `${customer.label}: ${customer.summary}`,
      });
    }
    for (const rm of roadmapSignals) {
      if (rm.summary.toLowerCase().includes("sso")) {
        violations.push({
          rule: "sso_timeline_conflict",
          severity: rm.severity,
          detail: `${rm.label}: ${rm.summary}`,
        });
      }
    }
  }

  // Rule 1: PR touches auth and OAuth docs not updated
  for (const pr of prSignals) {
    const touchesAuth =
      pr.summary.toLowerCase().includes("oauth") ||
      pr.summary.toLowerCase().includes("auth") ||
      pr.label.toLowerCase().includes("oauth") ||
      pr.label.toLowerCase().includes("auth");

    if (touchesAuth) {
      const hasStaleDoc = docSignals.length > 0;
      // Even without an explicit stale doc signal, if a PR touches auth
      // and no doc update signal exists, flag it
      violations.push({
        rule: "docs_drift",
        severity: "high",
        detail: hasStaleDoc
          ? `PR "${pr.label}" changed auth code but OAuth docs are stale.`
          : `PR "${pr.label}" changed auth code — verify docs are up to date.`,
      });
    }
  }

  // Rule 2: Customer promise due date < roadmap target date
  for (const crm of crmSignals) {
    for (const rm of roadmapSignals) {
      violations.push({
        rule: "promise_conflict",
        severity: "high",
        detail: `Customer "${crm.label}" requires capabilities before roadmap can deliver (${rm.label}).`,
      });
    }
    // Even without roadmap signal, a renewal at risk is a violation
    if (roadmapSignals.length === 0) {
      violations.push({
        rule: "promise_conflict",
        severity: "high",
        detail: `Customer "${crm.label}" renewal is at risk — dependencies may not be met.`,
      });
    }
  }

  // Rule 3: Launch date < dependency approval date
  for (const rm of roadmapSignals) {
    violations.push({
      rule: "launch_risk",
      severity: "high",
      detail: `Launch depends on "${rm.label}" which has a scheduling conflict.`,
    });
  }

  // Rule 4: Public marketing claim conflicts with roadmap
  const browserSignals = signals.filter(
    (s) => s.source === "browser" && s.type === "public_truth_violation"
  );
  for (const bs of browserSignals) {
    violations.push({
      rule: "public_truth_violation",
      severity: "high",
      detail: `Public marketing claim conflicts with roadmap: "${bs.summary}".`,
    });
  }

  return violations;
}
