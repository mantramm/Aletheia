import { getNotionClient, DB_IDS, notionWrite, notionRead, getSeedClaimId } from "./notion-client";
import { clearLog } from "./syncLog";

async function archiveAllPages(databaseId: string): Promise<number> {
  const notion = getNotionClient();
  const result = await notionRead(() =>
    notion.databases.query({
      database_id: databaseId,
      page_size: 100,
    })
  );

  let archived = 0;
  for (const page of result.results) {
    await notionWrite(() =>
      notion.pages.update({
        page_id: page.id,
        archived: true,
      })
    );
    archived++;
  }
  return archived;
}

export async function resetDemo(): Promise<void> {
  const notion = getNotionClient();

  // Archive all records from all databases including claims
  await archiveAllPages(DB_IDS.rawSignals);
  await archiveAllPages(DB_IDS.evidenceReceipts);
  await archiveAllPages(DB_IDS.approvals);
  await archiveAllPages(DB_IDS.truthDiffs);
  await archiveAllPages(DB_IDS.concepts);
  await archiveAllPages(DB_IDS.truthBriefs);
  await archiveAllPages(DB_IDS.companyClaims);

  // Unarchive and reset the seed claim back to green/unclear
  const claimId = getSeedClaimId();
  await notionWrite(() =>
    notion.pages.update({
      page_id: claimId,
      archived: false,
    })
  );
  await notionWrite(() =>
    notion.pages.update({
      page_id: claimId,
      properties: {
        Verdict: { select: { name: "unclear" } },
        Status: { select: { name: "green" } },
      },
    })
  );

  clearLog();
}
