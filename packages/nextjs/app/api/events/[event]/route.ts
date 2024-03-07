import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const GET = async (req: Request, { params }: { params: { event: string } }) => {
  try {
    const eventSlug = params.event;

    const eventKey = `events-tracker-events-${eventSlug}`;
    const event = await kv.get(eventKey);

    if (!event) {
      return NextResponse.json({ error: true, message: "No Event" }, { status: 404 });
    }

    return NextResponse.json({ error: false, event }, { status: 201 });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ error: true }, { status: 500 });
  }
};
