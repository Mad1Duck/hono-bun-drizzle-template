export type StreamListener<T = unknown> = (topic: string, payload: T) => void;

export interface EventHub<T = unknown> {
  broadcast: (topic: string, payload: T) => void;
  subscribe: (listener: StreamListener<T>) => () => void;
}

export const createEventHub = <T = unknown>(): EventHub<T> => {
  const listeners = new Set<StreamListener<T>>();

  const broadcast = (topic: string, payload: T) => {
    for (const listener of listeners) {
      listener(topic, payload);
    }
  };

  const subscribe = (listener: StreamListener<T>) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return { broadcast, subscribe };
};

const globalHub = createEventHub();

export const eventHub = globalHub;
export const broadcast = globalHub.broadcast;
