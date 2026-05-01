import { useSetAtom, useAtomValue } from "jotai";
import { useMutation } from "react-query";
import { dataState,activityState } from "../store";
import { authAtom } from "../store/authStore";
import { GraphQLClient, gql } from "graphql-request";

function useAppGraphQLClient() {
  const token = useAtomValue(authAtom);
  return new GraphQLClient("http://localhost/graphql", {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
}

export function useUserApi(){
  const setData = useSetAtom(dataState);
  const graphQLClient = useAppGraphQLClient();

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

export function useAddUserApi(){
  const graphQLClient = useAppGraphQLClient();

  const { mutate } = useMutation(
    async (user) => await graphQLClient.request(gql`mutation {
      addUser(input : {name: "${user.name}",age: ${parseInt(user.age)},gender: "${user.gender}"}){
        id,  
        name,
        age,
        gender
      }
    }`),
    {
      onSuccess(resp) {
      },
      onError(err) {
      }
    }
  );

  return {mutateAdd: (user) => mutate(user)}
}

export function useEditUserApi(){
  const graphQLClient = useAppGraphQLClient();

  const { mutate } = useMutation(
    async (user) => await graphQLClient.request(gql`mutation {
      editUser(id: "${user.id}" , input : {name: "${user.name}",age: ${parseInt(user.age)},gender:"${user.gender}"}){
        id,  
        name,
        age,
        gender
      }
    }`),
    {
      onSuccess(resp) {
      },
      onError(err) {
      }
    }
  );

  return {mutateEdit: (user) => mutate(user)}
}

export function useDeleteUserApi(){
  const graphQLClient = useAppGraphQLClient();

  const { mutate } = useMutation(
    async (userid) => await graphQLClient.request(gql`mutation {
      deleteUser(id: ${userid}){
        id
      }
    }`),
    {
      onSuccess(resp) {
      },
      onError(err) {
      }
    }
  );

  return {mutateDelete: (userid) => mutate(userid)}
}

export function useActivityApi(){
  const setActivity = useSetAtom(activityState);
  const graphQLClient = useAppGraphQLClient();
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
