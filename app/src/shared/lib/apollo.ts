import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import Constants from "expo-constants";
import { useAuthStore } from "@shared/store/auth";

const apiUrl = Constants.expoConfig?.extra?.apiUrl || "http://localhost:4000/graphql";

const httpLink = new HttpLink({ uri: apiUrl });

const authLink = setContext(async (_, { headers }) => {
  const { session, workspaceId } = useAuthStore.getState();
  return {
    headers: {
      ...headers,
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
      ...(workspaceId && { "x-workspace-id": workspaceId }),
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
