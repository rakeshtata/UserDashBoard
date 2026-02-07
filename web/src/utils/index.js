import { useAtomValue, useUpdateAtom } from "jotai/utils";
const {dataState, greaterThenAgeState, includedGenderState, filteredDataState} from './store';

const data = useAtomValue(dataState);
const dispatchFilteredData = useUpdateAtom(filteredDataState);
const genderList = useAtomValue(includedGenderState);
const age = useAtomValue(greaterThenAgeState);

export const fetchFilterData = () => {
   dispatchFilteredData(data.filter(user=>genderList.indexOf(user.gender)!==-1)
                           .filter(user=>user.age>age))
}
