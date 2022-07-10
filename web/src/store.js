import { atom } from "jotai";

export const dataState = atom([]);
export const greaterThenAgeState = atom(0);
export const includedGenderState = atom(['Male', 'Female','Unknown']);
export const selectedUserState = atom("");
export const activityState = atom([]);
export const filteredDataState = atom((get) =>
  get(dataState).filter(user=>get(includedGenderState).indexOf(user.gender)!==-1)
                          .filter(user=>user.age>get(greaterThenAgeState))
);

 //export default {dataState, greaterThenAgeState, includedGenderState, selectedUserState, filteredDataState};
