import type { UseBoundStore, StoreApi } from 'zustand'
import { useShallow } from 'zustand/shallow'

export const useStoreField = <T, K extends keyof T>(
  useStore: UseBoundStore< StoreApi<T> >,
  fields: K[],
): Pick<T, K> => {
  return useStore(useShallow(state=> {
    const res = {} as Pick<T, K>;
    fields.forEach(item=> {
      res[item] = state[item];
    });
    return res;
  }));
};