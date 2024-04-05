import { NextResponse } from "next/server";
import scaffoldConfig from "../../../../scaffold.config";
import { EIP_712_DOMAIN, EIP_712_TYPES__ADMIN_EXPENSES_ADD_MESSAGE } from "../../../../utils/eip712";
import { generateSlug } from "../../../../utils/slug";
import { kv } from "@vercel/kv";
import { recoverTypedDataAddress } from "viem";

type ReqBody = {
  signature: `0x${string}`;
  signer: string;
  event: string;
  amount: number;
  address: `0x${string}`;
};

export const POST = async (req: Request) => {
  try {
    const { signature, signer, event, amount, address } = (await req.json()) as ReqBody;
    if (!signature || !signer || !event || !amount || !address) {
      return NextResponse.json({ verified: false, message: "Wrong parameters" }, { status: 400 });
    }

    const recoveredAddress = await recoverTypedDataAddress({
      domain: EIP_712_DOMAIN,
      types: EIP_712_TYPES__ADMIN_EXPENSES_ADD_MESSAGE,
      primaryType: "Message",
      message: { action: "Event Expense Admin", event, amount: BigInt(amount), address },
      signature: signature,
    });

    if (recoveredAddress !== signer) {
      return NextResponse.json({ verified: false, message: "Wrong signature" }, { status: 401 });
    }

    if (scaffoldConfig.adminAddresses.filter((member: any) => member === recoveredAddress).length === 0) {
      return NextResponse.json({ verified: false, message: "Not an admin" }, { status: 403 });
    }

    const eventSlug = generateSlug(event);
    const eventKey = `events-tracker-events-${eventSlug}`;
    const eventExists = await kv.get(eventKey);

    if (!eventExists) {
      return NextResponse.json({ verified: false, message: "Event does not exist" }, { status: 400 });
    }

    const setKey = `events-tracker-expenses-${eventSlug}`;

    await kv.zadd(setKey, { score: amount, member: address });

    return NextResponse.json({ verified: true, member: true }, { status: 201 });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ verified: false, message: "Unexpected error" }, { status: 500 });
  }
};
