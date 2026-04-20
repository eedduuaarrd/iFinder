import { setAuthTokenGetter } from '@workspace/api-client-react';

let currentToken: string | null = null;

export function setAuthToken(token: string | null) {
  currentToken = token;
}

// Initialize the getter for the API client
setAuthTokenGetter(() => currentToken);
