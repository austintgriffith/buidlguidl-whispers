"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  const [isMember, setIsMember] = useState(false);
  const [isLoadingMember, setLoadingMember] = useState(false);

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
