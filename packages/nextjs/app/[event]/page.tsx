"use client";

import React, { useEffect, useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { Address, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { EIP_712_DOMAIN, EIP_712_TYPES__MESSAGE } from "~~/utils/eip712";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

export default function EventPage({ params }: { params: { event: string } }) {
  const { address: connectedAddress } = useAccount();

  const selectedEvent = params.event;

  const { signTypedDataAsync, isLoading: isSigningEIP712Message } = useSignTypedData();

  const [amount, setAmount] = useState<number>(0);
  const [isMember, setIsMember] = useState(false);
  const [isLoadingMember, setLoadingMember] = useState(false);
  const [isLoadingEvent, setLoadingEvent] = useState(true);
  const [selectedEventName, setSelectedEventName] = useState<string>("");

  const handleEIP712MessageSign = async () => {
    try {
      const signature = await signTypedDataAsync({
        domain: EIP_712_DOMAIN,
        types: EIP_712_TYPES__MESSAGE,
        primaryType: "Message",
        message: {
          action: "Event Expense",
          event: selectedEventName,
          amount: BigInt(amount),
        },
      });

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signature, signer: connectedAddress, event: selectedEventName, amount }),
      });

      if (res.ok) {
        const data = (await res.json()) as { verified: boolean; message: string };
        if (data.verified) {
          notification.success("Expense Saved");
        } else {
          notification.error(data.message);
        }
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

  useEffect(() => {
    const updateEvent = async () => {
      try {
        setLoadingEvent(true);
        const response = await fetch(`/api/events/${selectedEvent}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.error) {
            notification.error(data.message);
          } else {
            setSelectedEventName(data.event);
          }
        }
      } catch (e) {
        console.log("Error getting event data", e);
      } finally {
        setLoadingEvent(false);
      }
    };

    if (selectedEvent) {
      updateEvent();
    }
  }, [selectedEvent]);

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 flex flex-col items-center justify-center">
          <div className="p-10">
            <img src="/whispersbig.png" alt="buidlGuidl whispers" style={{ maxWidth: 350 }} />
          </div>

          {connectedAddress ? (
            <>
              <div className="flex justify-center items-center space-x-2">
                <p className="my-2 font-medium">Connected Address:</p>
                <Address address={connectedAddress} />
              </div>
              {isLoadingMember ? (
                <div className="flex justify-center items-center space-x-2">
                  <p className="my-2 font-medium">
                    <span className="loading loading-ring loading-xs"></span> Checking BuidlGuidl Membership...{" "}
                    <span className="loading loading-ring loading-xs"></span>
                  </p>
                </div>
              ) : isMember ? (
                <>
                  <div className="flex gap-3 self-center mb-4 text-green-600">BuidlGuidl Member</div>
                  {isLoadingEvent ? (
                    <div className="flex justify-center items-center space-x-2">
                      <p className="my-2 font-medium">Loading event data...</p>
                    </div>
                  ) : selectedEventName ? (
                    <>
                      <div className="flex gap-3 self-center mt-4">
                        <p className="font-bold text-xl">{selectedEventName}</p>
                      </div>
                      <div className="flex flex-col gap-3 self-center mb-4 text-center font-medium">
                        <p className="mb-0">
                          Thank you for attending <em className="font-bold">{selectedEventName}</em> and supporting
                          BuidlGuidl!!!
                        </p>
                        <p className="mt-0">Please estimate your personal expense to make this happen:</p>
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
                      <p className="my-2 font-medium">Event does not exist</p>
                    </div>
                  )}
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
}
