import scaffoldConfig from "~~/scaffold.config";

export const EIP_712_DOMAIN = {
  name: "BuidlGuidl Events Tracker",
  version: "1",
  chainId: scaffoldConfig.targetNetworks[0].id,
} as const;

export const EIP_712_TYPES__MESSAGE = {
  Message: [
    { name: "action", type: "string" },
    { name: "event", type: "string" },
    { name: "amount", type: "uint256" },
  ],
} as const;

export const EIP_712_TYPES__ADMIN_EXPENSES_MESSAGE = {
  Message: [
    { name: "action", type: "string" },
    { name: "event", type: "string" },
  ],
} as const;

export const EIP_712_TYPES__ADMIN_EVENTS_MESSAGE = {
  Message: [{ name: "action", type: "string" }],
} as const;

export const EIP_712_TYPES__ADMIN_EVENT_NEW_MESSAGE = {
  Message: [
    { name: "action", type: "string" },
    { name: "event", type: "string" },
  ],
} as const;

export const EIP_712_TYPES__ADMIN_EXPENSES_ADD_MESSAGE = {
  Message: [
    { name: "action", type: "string" },
    { name: "event", type: "string" },
    { name: "amount", type: "uint256" },
    { name: "address", type: "address" },
  ],
} as const;
