'use client';

import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from 'react';

export type authProps = {
  isConnected: boolean;
  setIsConnected: Dispatch<SetStateAction<boolean>>;
};

const initialState: authProps = {
  isConnected: false,
  setIsConnected: () => {},
};

const AuthContext = createContext(initialState);

type ConfigProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: ConfigProviderProps) {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <AuthContext.Provider value={{ isConnected, setIsConnected }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const auth = useContext(AuthContext);
  if (auth === undefined) {
    throw new Error('context not found');
  }
  return auth;
};

export default AuthContext;
