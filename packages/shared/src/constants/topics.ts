export const UNCOMPLETED_ORDER = "UNCOMPLETED_ORDER" as const;
export const UNCOMPLETED_KITCHEN = "UNCOMPLETED_KITCHEN" as const;
export const FOOD_TOPIC = "FOOD_TOPIC" as const;
export const CATEGORY_TOPIC = "CATEGORY_TOPIC" as const;
export const USER_ACTIVITY = "USER_ACTIVITY" as const;
export const NOTIFICATION = "NOTIFICATION" as const;
export const ORDER_STATUS_CHANGED = "ORDER_STATUS_CHANGED" as const;
export const SYSTEM_BROADCAST = "SYSTEM_BROADCAST" as const;
export const USER_ROLE_CHANGED = "USER_ROLE_CHANGED" as const;

export const TOPICS = {
  UNCOMPLETED_ORDER,
  UNCOMPLETED_KITCHEN,
  FOOD_TOPIC,
  CATEGORY_TOPIC,
  USER_ACTIVITY,
  NOTIFICATION,
  ORDER_STATUS_CHANGED,
  SYSTEM_BROADCAST,
  USER_ROLE_CHANGED,
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];

export const isTopic = (value: string): value is Topic => {
  return Object.values(TOPICS).includes(value as Topic);
};
