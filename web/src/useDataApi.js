import { useUpdateAtom } from "jotai/utils";
import { useMutation } from "react-query";
import { dataState,activityState } from "./store";
import { GraphQLClient, gql } from "graphql-request";

export  function useUserApi(){
  const setData = useUpdateAtom(dataState);
  const graphQLClient = new GraphQLClient("http://localhost:4000/graphql")

  const query = gql`{
                    users {
                      id
                      name
                      age
                      gender
                    }
                }`

  const { mutate } = useMutation(
    async () => await graphQLClient.request(query),
    {
      onSuccess(resp) {
        setData(resp.users);
      },
      onError(err) {
        setData([])
      }
    }
  );

  return {mutateUser: () => mutate()}
}

export  function useActivityApi(){
  const setActivity = useUpdateAtom(activityState);
  const graphQLClient = new GraphQLClient("http://localhost:4000/graphql")
  const { mutate } = useMutation(
    async (userid) => await graphQLClient.request(gql`
        {
          activities(id: "${userid}"){
            date
            count
          }
      }`),
    {
      onSuccess(resp) {
        setActivity(resp.activities);
      },
      onError(err) {
        setActivity([])
      }
    }
  );

  return {mutateActivity: (userid) => mutate(userid)}
}
