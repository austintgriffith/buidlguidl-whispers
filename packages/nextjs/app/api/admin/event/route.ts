import { NextResponse } from "next/server";
import scaffoldConfig from "../../../../scaffold.config";
import { kv } from "@vercel/kv";
import { recoverTypedDataAddress } from "viem";
import { EIP_712_DOMAIN, EIP_712_TYPES__ADMIN_EXPENSES_MESSAGE } from "~~/utils/eip712";
import { generateSlug } from "~~/utils/slug";

type ReqBody = {
  signature: `0x${string}`;
  signer: string;
  event: string;
};

export const POST = async (req: Request) => {
  try {
    const { signature, signer, event } = (await req.json()) as ReqBody;
    if (!signature || !signer || !event) {
      return NextResponse.json({ verified: false, message: "Wrong parameters" }, { status: 400 });
    }

    const recoveredAddress = await recoverTypedDataAddress({
      domain: EIP_712_DOMAIN,
      types: EIP_712_TYPES__ADMIN_EXPENSES_MESSAGE,
      primaryType: "Message",
      message: { action: "Event Create", event },
      signature: signature,
    });

    if (recoveredAddress !== signer) {
      return NextResponse.json({ verified: false }, { status: 401 });
    }

    if (scaffoldConfig.adminAddresses.filter((member: any) => member === recoveredAddress).length === 0) {
      return NextResponse.json({ verified: false, message: "Not an admin" }, { status: 403 });
    }

    const eventSlug = generateSlug(event);

    if (eventSlug.length === 0) {
      return NextResponse.json({ verified: false, message: "Invalid event name" }, { status: 400 });
    }

    const eventKey = `events-tracker-events-${eventSlug}`;
    const eventExists = await kv.get(eventKey);

    if (eventExists) {
      return NextResponse.json({ verified: false, message: "Event already exists" }, { status: 400 });
    }

    await kv.set(eventKey, event);

    const setKey = `events-tracker-events`;
    await kv.sadd(setKey, event);

    return NextResponse.json({ verified: true, created: true, slug: eventSlug }, { status: 201 });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ verified: false, error: true }, { status: 500 });
  }
};
