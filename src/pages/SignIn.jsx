import React, { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from 'react-router-dom'

export default function SignIn() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!validateEmail(email)) {
      setError("올바른 이메일을 입력하세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: { data: { name: trimmedName } },
          });
  
          if (authError) throw authError;
  
          // 2️⃣ users 테이블에 동기화
          const { error: tableError } = await supabase.from("users").insert([
            {
              id: authData.user.id,
              email: trimmedEmail,
              name: trimmedName,
            },
          ]);
  
          if (tableError) throw tableError;
  
          alert("회원가입 성공!");
          setMode("login");
      } else {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
        });

        if (loginError) throw loginError;

        alert("로그인 성공!");
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "오류 발생");
    }
    setLoading(false);
  }

  return (
    <div style={{padding:'24px'}}>
      <h1>{mode === "login" ? "로그인" : "회원가입"}</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <input
              className="input"
              placeholder="이름"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          )}
          <input
            className="input"
            placeholder="이메일"
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            required
          />
          <input
            className="input"
            placeholder="비밀번호"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div className="mb-8" style={{color:'red'}}>{error}</div>}
          <button disabled={loading}>{loading ? "loading..." : (mode==="login"?"로그인":"회원가입")}</button>
          {mode==="login" ? (
            <button type="button" className="button-secondary ml-8" onClick={()=>setMode("signup")}>회원가입 →</button>
          ) : (
            <button type="button" className="button-secondary ml-8" onClick={()=>setMode("login")}>로그인 →</button>
          )}
        </form>
      </div>
    </div>
  )
}