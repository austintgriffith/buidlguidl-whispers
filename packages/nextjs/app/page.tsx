"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useAccount, useSignTypedData } from "wagmi";
import { Address, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { EIP_712_DOMAIN, EIP_712_TYPES__MESSAGE } from "~~/utils/eip712";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  const { signTypedDataAsync, isLoading: isSigningEIP712Message } = useSignTypedData();

  const [selectedEvent, setSelectedEvent] = useState<string>("ETHDenver 2024");
  const [amount, setAmount] = useState<number>(0);
  const [isMember, setIsMember] = useState(false);
  const [isLoadingMember, setLoadingMember] = useState(false);

  const action = "Event Expense";

  const handleEIP712MessageSign = async () => {
    try {
      const signature = await signTypedDataAsync({
        domain: EIP_712_DOMAIN,
        types: EIP_712_TYPES__MESSAGE,
        primaryType: "Message",
        message: {
          action,
          event: selectedEvent,
          amount: BigInt(amount),
        },
      });

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signature, signer: connectedAddress, action, event: selectedEvent, amount }),
      });

      if (res.ok) {
        const data = (await res.json()) as { verified: boolean };
        notification.success(data.verified ? "Message Verified" : "Message Not Verified");
      } else {
        notification.error("Failed to verify message");
      }
    } catch (e) {
      const parsedErrorMessage = getParsedError(e);
      notification.error(parsedErrorMessage);
    }
  };

  const bgUrl = "https://buidlguidl-v3.ew.r.appspot.com/builders";

  useEffect(() => {
    const updateMember = async () => {
      try {
        setLoadingMember(true);
        const response = await fetch(bgUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsMember(data.filter((member: any) => member.id === connectedAddress).length > 0);
        }
      } catch (e) {
        console.log("Error checking if user is a bg member", e);
      } finally {
        setLoadingMember(false);
      }
    };

    if (connectedAddress) {
      updateMember();
    }
  }, [connectedAddress]);

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 flex flex-col items-center justify-center">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">BuildGuidl Events Tracker</span>
          </h1>
          {connectedAddress ? (
            <>
              <div className="flex justify-center items-center space-x-2">
                <p className="my-2 font-medium">Connected Address:</p>
                <Address address={connectedAddress} />
              </div>
              {isLoadingMember ? (
                <div className="flex justify-center items-center space-x-2">
                  <p className="my-2 font-medium">Checking if you are a member...</p>
                </div>
              ) : isMember ? (
                <>
                  <div className="flex gap-3 self-center mb-4 text-green-600">BuidlGuidl Member</div>
                  <div className="flex gap-3 self-center mb-4 mt-8">
                    <label className="label">Select Event</label>
                    <select
                      className="select select-bordered w-48"
                      onChange={value => setSelectedEvent(value.target.value)}
                    >
                      <option>ETHDenver 2024</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-3 self-center mb-4 text-center font-bold">
                    <p className="mb-0">Thank you for attending {selectedEvent} and supporting BuidlGuidl.</p>
                    <p className="mt-0">Please estimate your personal expense to make this happen.</p>
                  </div>
                  <div className="flex gap-3 self-center mb-4">
                    <label className="label">Amount (USD)</label>
                    <input
                      type="number"
                      className="input input-bordered w-48"
                      placeholder="Amount (USD)"
                      value={amount}
                      onChange={value => setAmount(parseInt(value.target.value))}
                    />
                  </div>
                  <div className="flex gap-3 self-center">
                    <button
                      className="btn btn-primary"
                      disabled={isSigningEIP712Message}
                      onClick={handleEIP712MessageSign}
                    >
                      {isSigningEIP712Message && <span className="loading loading-spinner"></span>}
                      Submit (private)
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex justify-center items-center space-x-2 text-rose-600">
                  <p className="my-2 font-medium">You are not a member of BuildGuidl</p>
                </div>
              )}
            </>
          ) : (
            <RainbowKitCustomConnectButton />
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
