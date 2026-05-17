"use client";

import { useState, useCallback, useEffect } from "react";

export type TruthStatus = "green" | "yellow" | "red";

export type Signal = {
  id: string;
  source: "github" | "slack" | "crm" | "roadmap" | "notion" | "browser";
  type: string;
  label: string;
  summary: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
};

export type Concept = {
  id: string;
  title: string;
  stage: string;
  supportingSignalIds: string[];
};

export type EvidenceReceipt = {
  id: string;
  source: Signal["source"];
  title: string;
  summary: string;
  severity: "low" | "medium" | "high";
  notionUrl?: string;
};

export type Approval = {
  id: string;
  action: string;
  riskLevel: "low" | "medium" | "high";
  status: "needs_approval" | "approved" | "rejected";
  evidenceIds: string[];
};

export type Trial = {
  title: string;
  charges: string[];
  verdict: string;
  sentence: string[];
};

export type AletheiaState = {
  status: TruthStatus;
  activeClaim: {
    id: string;
    text: string;
    verdict: string;
  };
  signals: Signal[];
  concepts: Concept[];
  truthDiff: {
    belief: string[];
    reality: string[];
    verdict: string;
    recommendedActions: string[];
  };
  evidence: EvidenceReceipt[];
  approvals: Approval[];
  syncLog: {
    id: string;
    text: string;
    status: "pending" | "done" | "failed";
    timestamp: string;
  }[];
  trial?: Trial;
};

async function api<T = AletheiaState>(
  path: string,
  method: "GET" | "POST" = "GET",
): Promise<T> {
  const res = await fetch(path, { method });
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json();
}

export function useAletheia() {
  const [state, setState] = useState<AletheiaState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const data = await api("/api/state");
      setState(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const runAction = useCallback(
    async (path: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await api(path, "POST");
        setState(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const triggerPR = useCallback(
    () => runAction("/api/demo/trigger-pr"),
    [runAction],
  );
  const syncCRM = useCallback(
    () => runAction("/api/demo/sync-crm"),
    [runAction],
  );
  const syncRoadmap = useCallback(
    () => runAction("/api/demo/sync-roadmap"),
    [runAction],
  );
  const addSlack = useCallback(
    () => runAction("/api/demo/add-slack-signal"),
    [runAction],
  );
  const runTrial = useCallback(
    () => runAction("/api/demo/run-trial"),
    [runAction],
  );
  const reset = useCallback(
    () => runAction("/api/demo/reset"),
    [runAction],
  );

  return {
    state,
    loading,
    error,
    triggerPR,
    syncCRM,
    syncRoadmap,
    addSlack,
    runTrial,
    reset,
    fetchState,
  };
}
