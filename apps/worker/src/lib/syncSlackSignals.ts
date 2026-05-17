import * as path from "path";
import * as fs from "fs";
import type { Signal } from "./types";
import { createRawSignal, createConcept } from "./notion-writes";
import { getSeedClaimId } from "./notion-client";

export async function syncSlackSignals(): Promise<void> {
  const demoPath = path.resolve(process.cwd(), "../../data/demo/slack-signals.json");
  const data = JSON.parse(fs.readFileSync(demoPath, "utf-8"));
  const msg = data.messages[0];

  const signal: Omit<Signal, "id"> = {
    source: "slack",
    type: "idea",
    label: "Enterprise Readiness",
    summary: `${msg.author} in ${msg.channel}: "${msg.text}"`,
    timestamp: msg.timestamp,
    severity: "low",
  };

  const signalId = await createRawSignal(signal);

  await createConcept({
    title: "Enterprise Readiness",
    stage: "raw",
    supportingSignalIds: [signalId],
    relatedClaimId: getSeedClaimId(),
  });
}
