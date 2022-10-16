export type ActionLog = {
  action: any;
  prevState: any;
  nextState: any;
};

export type Callback = (log: ActionLog) => void;

let callbacks: Callback[] = [];

export function addCallback(cb: Callback) {
  callbacks.push(cb);

  return () => {
    callbacks = callbacks.filter(c => c !== cb);
  };
}

export const loggerMiddleware =
  (storeAPI: { getState: () => any }) =>
  (next: (action: any) => any) =>
  (action: any) => {
    if (callbacks.length <= 0) return next(action);

    const prevState = storeAPI.getState();
    const result = next(action);
    const nextState = storeAPI.getState();
    callbacks.forEach(cb => cb({ action, prevState, nextState }));

    return result;
  };

export default loggerMiddleware;
