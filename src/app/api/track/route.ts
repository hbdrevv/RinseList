/**
 * =============================================================================
 * ANALYTICS TRACKING API ROUTE
 * =============================================================================
 *
 * Simple endpoint for tracking list processing events.
 * Logs to console which is captured by Vercel (viewable in Logs dashboard).
 *
 * MVP implementation - can be upgraded later to:
 * - Database storage (Vercel KV, PlanetScale, etc.)
 * - External analytics service (Mixpanel, Amplitude, etc.)
 * - Webhook integrations
 *
 * =============================================================================
 */

import { NextResponse } from "next/server";

/**
 * Expected payload structure for list_processed events
 */
interface TrackingPayload {
  event: string;
  totalRows?: number;
  cleanedCount?: number;
  suppressedCount?: number;
  invalidCount?: number;
  contactFileType?: string;
  suppressionFileType?: string;
}

export async function POST(request: Request) {
  try {
    const data: TrackingPayload = await request.json();

    // Log the event - captured by Vercel and viewable in Logs dashboard
    console.log(
      JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
      })
    );

    return NextResponse.json({ ok: true });
  } catch {
    // Fail silently - analytics should never break the app
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
