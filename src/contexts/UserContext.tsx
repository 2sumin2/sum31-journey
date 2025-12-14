import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase";

const UserContext = createContext({});

export function UserProvider({ children }) {
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // 최초 mount 시
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? '');
      setUserName(user?.user_metadata?.name ?? null);
    });
    // Auth 변화 구독
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? '');
      setUserName(session?.user?.user_metadata?.name ?? null);
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ userId, userName, setUserId, setUserName }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}