import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { recoverTypedDataAddress } from "viem";
import { EIP_712_DOMAIN, EIP_712_TYPES__MESSAGE } from "~~/utils/eip712";
import { generateSlug } from "~~/utils/slug";

type ReqBody = {
  signature: `0x${string}`;
  signer: string;
  event: string;
  amount: number;
};

export const POST = async (req: Request) => {
  try {
    const { signature, signer, event, amount } = (await req.json()) as ReqBody;
    if (!signature || !signer || !event || !amount) {
      return NextResponse.json({ verified: false }, { status: 400 });
    }

    const recoveredAddress = await recoverTypedDataAddress({
      domain: EIP_712_DOMAIN,
      types: EIP_712_TYPES__MESSAGE,
      primaryType: "Message",
      message: { action: "Event Expense", event, amount: BigInt(amount) },
      signature: signature,
    });

    if (recoveredAddress !== signer) {
      return NextResponse.json({ verified: false }, { status: 401 });
    }

    const bgUrl = "https://buidlguidl-v3.ew.r.appspot.com/builders";

    let isMember = false;

    const response = await fetch(bgUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      isMember = data.filter((member: any) => member.id === recoveredAddress).length > 0;
    }

    if (!isMember) {
      return NextResponse.json({ verified: true, member: false }, { status: 403 });
    }

    const eventSlug = generateSlug(event);
    const eventKey = `events-tracker-events-${eventSlug}`;
    const eventExists = await kv.get(eventKey);

    if (!eventExists) {
      return NextResponse.json({ verified: false, message: "Event does not exist" }, { status: 400 });
    }

    const setKey = `events-tracker-expenses-${eventSlug}`;

    await kv.zadd(setKey, { score: amount, member: recoveredAddress });

    return NextResponse.json({ verified: true, member: true }, { status: 201 });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ verified: false }, { status: 500 });
  }
};
