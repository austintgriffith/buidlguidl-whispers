import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { recoverTypedDataAddress } from "viem";
import { EIP_712_DOMAIN, EIP_712_TYPES__MESSAGE } from "~~/utils/eip712";

type ReqBody = {
  signature: `0x${string}`;
  signer: string;
  message: string;
  action: string;
  event: string;
  amount: number;
};

export const POST = async (req: Request) => {
  try {
    const { signature, signer, action, event, amount } = (await req.json()) as ReqBody;
    if (!signature || !signer || !action || !event || !amount) {
      return NextResponse.json({ verified: false }, { status: 400 });
    }
    if (action !== "Event Expense") {
      return NextResponse.json({ verified: false }, { status: 400 });
    }
    // TODO: get events from KV
    if (event !== "ETHDenver 2024") {
      return NextResponse.json({ verified: false }, { status: 400 });
    }
    const recoveredAddress = await recoverTypedDataAddress({
      domain: EIP_712_DOMAIN,
      types: EIP_712_TYPES__MESSAGE,
      primaryType: "Message",
      message: { action, event, amount: BigInt(amount) },
      signature: signature,
    });

    console.log("recoveredAddress", recoveredAddress);

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

    const setKey = `events-tracker-expenses-ethdenver2024`;

    const result = await kv.zadd(setKey, { score: amount, member: recoveredAddress });
    console.log("result", result);

    return NextResponse.json({ verified: true, member: true }, { status: 201 });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ verified: false }, { status: 500 });
  }
};
