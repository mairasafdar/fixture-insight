import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type EngagementRow = {
  fixture_id: number;
  matchup: string;
  utc_date: string;
  card_clicks: number;
  angle_clicks: number;
  avg_card_dwell_ms: number;
  avg_angle_dwell_ms: number;
  total_clicks: number;
};

export const getSponsorEngagement = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ sponsorId: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<EngagementRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await (supabaseAdmin as any).schema("private").rpc(
      "get_sponsor_engagement",
      { _sponsor_id: data.sponsorId },
    );
    if (error) throw new Error(error.message);
    return (rows ?? []) as EngagementRow[];
  });
