"use client";

import React, { useEffect, useState } from "react";
import { Address, RainbowKitCustomConnectButton } from "../../components/scaffold-eth";
import scaffoldConfig from "../../scaffold.config";
import { EIP_712_DOMAIN, EIP_712_TYPES__ADMIN_MESSAGE } from "../../utils/eip712";
import { getParsedError, notification } from "../../utils/scaffold-eth";
import type { NextPage } from "next";
import { useAccount, useSignTypedData } from "wagmi";

const AdminHome: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  const { signTypedDataAsync, isLoading: isSigningEIP712Message } = useSignTypedData();

  const [selectedEvent, setSelectedEvent] = useState<string>("ETHDenver 2024");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAdmin, setLoadingAdmin] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const action = "Event Expenses Show";

  const handleEIP712MessageSign = async () => {
    try {
      const signature = await signTypedDataAsync({
        domain: EIP_712_DOMAIN,
        types: EIP_712_TYPES__ADMIN_MESSAGE,
        primaryType: "Message",
        message: {
          action,
          event: selectedEvent,
        },
      });

      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signature, signer: connectedAddress, action, event: selectedEvent }),
      });

      if (res.ok) {
        const data = (await res.json()) as { verified: boolean; expenses: any[] };
        notification.success(data.verified ? "Message Verified" : "Message Not Verified");
        setExpenses(data.expenses);
      } else {
        notification.error("Failed to verify message");
      }
    } catch (e) {
      const parsedErrorMessage = getParsedError(e);
      notification.error(parsedErrorMessage);
    }
  };

  useEffect(() => {
    const updateAdmin = async () => {
      try {
        setLoadingAdmin(true);
        console.log("scaffoldConfig.adminAddresses", scaffoldConfig.adminAddresses);
        setIsAdmin(scaffoldConfig.adminAddresses.filter((member: any) => member === connectedAddress).length > 0);
      } catch (e) {
        console.log("Error checking if user is an admin", e);
      } finally {
        setLoadingAdmin(false);
      }
    };

    if (connectedAddress) {
      updateAdmin();
    }
  }, [connectedAddress]);

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 flex flex-col items-center justify-center">
          <h1 className="text-center">
            <span className="block text-4xl font-bold">BuildGuidl Events Tracker Admin</span>
          </h1>
          {connectedAddress ? (
            <>
              <div className="flex justify-center items-center space-x-2">
                <p className="my-2 font-medium">Connected Address:</p>
                <Address address={connectedAddress} />
              </div>
              {isLoadingAdmin ? (
                <div className="flex justify-center items-center space-x-2">
                  <p className="my-2 font-medium">Checking if you are a member...</p>
                </div>
              ) : isAdmin ? (
                <>
                  <div className="flex gap-3 self-center mb-4 text-green-600">BuidlGuidl Admin</div>
                  <div className="flex gap-3 self-center mb-4 mt-8">
                    <label className="label">Select Event</label>
                    <select
                      className="select select-bordered w-48"
                      onChange={value => setSelectedEvent(value.target.value)}
                    >
                      <option>ETHDenver 2024</option>
                    </select>
                  </div>
                  <div className="flex gap-3 self-center mb-4">
                    <button
                      className="btn btn-primary"
                      onClick={handleEIP712MessageSign}
                      disabled={isSigningEIP712Message}
                    >
                      Show Expenses
                    </button>
                  </div>
                  {expenses.length > 0 && (
                    <div className="flex flex-col gap-3 self-center mb-4">
                      <h2 className="text-2xl font-bold text-center mt-4">Expenses</h2>
                      <table className="table-auto">
                        <thead>
                          <tr>
                            <th className="p-4 text-center">
                              <input
                                type="checkbox"
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedMembers(expenses.map(expense => expense.address));
                                  } else {
                                    setSelectedMembers([]);
                                  }
                                }}
                              />
                            </th>
                            <th className="p-4">Member</th>
                            <th className="p-4">Amount (USD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.map((expense, index) => (
                            <tr key={index}>
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedMembers.filter(member => member === expense.address).length > 0}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setSelectedMembers([...selectedMembers, expense.address]);
                                    } else {
                                      setSelectedMembers(selectedMembers.filter(member => member !== expense.address));
                                    }
                                  }}
                                />
                              </td>
                              <td className="p-2">
                                <Address address={expense.address} />
                              </td>
                              <td className="text-right p-2">{expense.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button
                        className="btn btn-primary"
                        onClick={() => navigator.clipboard.writeText(selectedMembers.join(", "))}
                      >
                        Copy selected members to clipboard
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-center items-center space-x-2 text-rose-600">
                  <p className="my-2 font-medium">You are not a BuildGuidl admin</p>
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

export default AdminHome;
