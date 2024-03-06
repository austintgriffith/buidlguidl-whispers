import { NextResponse } from "next/server";
import scaffoldConfig from "../../../../scaffold.config";
import { kv } from "@vercel/kv";
import { recoverTypedDataAddress } from "viem";
import { EIP_712_DOMAIN, EIP_712_TYPES__ADMIN_MESSAGE } from "~~/utils/eip712";

type ReqBody = {
  signature: `0x${string}`;
  signer: string;
  message: string;
  action: string;
  event: string;
};

export const POST = async (req: Request) => {
  try {
    const { signature, signer, action, event } = (await req.json()) as ReqBody;
    if (!signature || !signer || !action || !event) {
      return NextResponse.json({ verified: false, message: "Wrong parameters" }, { status: 400 });
    }
    if (action !== "Event Expenses Show") {
      return NextResponse.json({ verified: false, message: "Wrong action" }, { status: 400 });
    }
    // TODO: get events from KV
    if (event !== "ETHDenver 2024") {
      return NextResponse.json({ verified: false, message: "wrong event" }, { status: 400 });
    }
    const recoveredAddress = await recoverTypedDataAddress({
      domain: EIP_712_DOMAIN,
      types: EIP_712_TYPES__ADMIN_MESSAGE,
      primaryType: "Message",
      message: { action, event },
      signature: signature,
    });

    console.log("recoveredAddress", recoveredAddress);

    if (recoveredAddress !== signer) {
      return NextResponse.json({ verified: false }, { status: 401 });
    }

    if (scaffoldConfig.adminAddresses.filter((member: any) => member === recoveredAddress).length === 0) {
      return NextResponse.json({ verified: false, message: "Not an admin" }, { status: 403 });
    }

    const setKey = `events-tracker-expenses-ethdenver2024`;
    const rawExpenses = await kv.zrange(setKey, 0, 10000, { rev: true, withScores: true });

    console.log("rawExpenses", rawExpenses);

    const expenses: { address: string; amount: number }[] = [];

    for (let i = 0; i < rawExpenses.length; i += 2) {
      const address = rawExpenses[i] as string;
      expenses.push({ address, amount: rawExpenses[i + 1] as number });
    }

    return NextResponse.json({ verified: true, expenses }, { status: 201 });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ verified: false, error: true }, { status: 500 });
  }
};
