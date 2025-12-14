import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function RequireAuth({ children }) {
  const nav = useNavigate();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) nav('/signin', { replace: true });
      setUserName(data?.session?.user?.user_metadata?.name);
    });
  }, [nav]);

  return children;
}