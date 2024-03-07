import { NextResponse } from "next/server";
import scaffoldConfig from "../../../../scaffold.config";
import { EIP_712_DOMAIN, EIP_712_TYPES__ADMIN_EVENTS_MESSAGE } from "../../../../utils/eip712";
import { kv } from "@vercel/kv";
import { recoverTypedDataAddress } from "viem";

type ReqBody = {
  signature: `0x${string}`;
  signer: string;
};

export const POST = async (req: Request) => {
  try {
    const { signature, signer } = (await req.json()) as ReqBody;
    if (!signature || !signer) {
      return NextResponse.json({ verified: false, message: "Wrong parameters" }, { status: 400 });
    }
    const recoveredAddress = await recoverTypedDataAddress({
      domain: EIP_712_DOMAIN,
      types: EIP_712_TYPES__ADMIN_EVENTS_MESSAGE,
      primaryType: "Message",
      message: { action: "Events Show" },
      signature: signature,
    });

    if (recoveredAddress !== signer) {
      return NextResponse.json({ verified: false }, { status: 401 });
    }

    if (scaffoldConfig.adminAddresses.filter((member: any) => member === recoveredAddress).length === 0) {
      return NextResponse.json({ verified: false, message: "Not an admin" }, { status: 403 });
    }

    const setKey = `events-tracker-events`;
    const events = await kv.smembers(setKey);

    return NextResponse.json({ verified: true, events }, { status: 201 });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ verified: false, error: true }, { status: 500 });
  }
};
