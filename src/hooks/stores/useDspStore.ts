import { create } from "zustand";
import { combine } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { coor } from "@/types/dataStruct";

const nameN = ['load', 'save', 'config'] as const;

type name = typeof nameN[number];

type ActionType = 
| { type: 'MODAL', name: name, from?: 'MOVE'|'CAPTURE' }
| { type: 'CLOSE', name: name }
;

interface State {
  load: {show: boolean},
  save: {show: boolean},
  config: {show: boolean},
}

const useDspStore = create(immer(combine(
  {
    load: {show: false},
    save: {show: false},
    config: {show: false},
  } as State,
  (set)=> ({
    changeDisplay: (action: ActionType)=> {
      set(draft=> {

        switch(action.type) {
          case "MODAL":
            draft[action.name].show = true;


            break;
          case "CLOSE":
            draft[action.name].show = false;
            break;
        }
      })
    },
  })
)));

export default useDspStore;