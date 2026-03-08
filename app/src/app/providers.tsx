import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@shared/lib/apollo";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
