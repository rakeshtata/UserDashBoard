import { useAtomValue, useSetAtom } from "jotai";
const {dataState, greaterThenAgeState, includedGenderState, filteredDataState} from './store';

const data = useAtomValue(dataState);
const dispatchFilteredData = useSetAtom(filteredDataState);
const genderList = useAtomValue(includedGenderState);
const age = useAtomValue(greaterThenAgeState);

export const fetchFilterData = () => {
   dispatchFilteredData(data.filter(user=>genderList.indexOf(user.gender)!==-1)
                           .filter(user=>user.age>age))
}
