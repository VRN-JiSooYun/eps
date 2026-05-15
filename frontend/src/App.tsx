import { FormEvent, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { listPendingQuoteRequests, login } from "./api";
import { MainPage } from "./pages/Main";
import Register from "./pages/Register";
import type { AuthResponse, QuoteRequest, Supplier } from "./types";

const tokenKey = "eps.auth.token";
const supplierKey = "eps.auth.supplier";
const rememberedEmailKey = "eps.auth.rememberedEmail";

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey) ?? "");
  const [supplier, setSupplier] = useState<Supplier | null>(() => {
    const raw = localStorage.getItem(supplierKey);
    return raw ? (JSON.parse(raw) as Supplier) : null;
  });
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const isAuthed = Boolean(token && supplier);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    listPendingQuoteRequests(token)
      .then((data) => setQuotes(data.quoteRequests))
      .catch((error: Error) => {
        setMessage(error.message);
        clearSession();
      })
      .finally(() => setLoading(false));
  }, [token]);

  function saveSession(auth: AuthResponse) {
    localStorage.setItem(tokenKey, auth.token);
    localStorage.setItem(supplierKey, JSON.stringify(auth.supplier));
    setToken(auth.token);
    setSupplier(auth.supplier);
    setMessage("");
  }

  function clearSession() {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(supplierKey);
    setToken("");
    setSupplier(null);
    setQuotes([]);
    navigate("/");
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthed && supplier ? (
            <MainPage supplier={supplier} quotes={quotes} loading={loading} message={message} onLogout={clearSession} />
          ) : (
            <AuthPanel onRegisterClick={() => navigate("/register")} onAuth={saveSession} message={message} setMessage={setMessage} />
          )
        }
      />
      <Route path="/register" element={isAuthed ? <Navigate to="/" replace /> : <Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AuthPanel({
  onRegisterClick,
  onAuth,
  message,
  setMessage
}: {
  onRegisterClick: () => void;
  onAuth: (auth: AuthResponse) => void;
  message: string;
  setMessage: (message: string) => void;
}) {
  const [email, setEmail] = useState(() => localStorage.getItem(rememberedEmailKey) ?? "");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(() => Boolean(localStorage.getItem(rememberedEmailKey)));
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      if (rememberEmail) {
        localStorage.setItem(rememberedEmailKey, email);
      } else {
        localStorage.removeItem(rememberedEmailKey);
      }

      const auth = await login({ email, password });
      onAuth(auth);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "요청 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen bg-white font-sans text-voronoi-gray-900">
      <section className="relative flex w-full flex-col items-center justify-center bg-white p-8 lg:w-[40%] lg:p-16">
        <div className="w-full max-w-md">
          <header className="mb-10">
            <div className="mb-8">
              <img className="h-14" src="/logos/1_vrn_ci.png"></img>
            </div>
            <h1 className="mb-2 text-4xl font-normal tracking-normal text-black">Login</h1>
            <p className="text-lg font-bold tracking-normal text-black">보로노이 파트너 플랫폼</p>
          </header>

          <form className="space-y-4" onSubmit={submit}>
            <label className="sr-only" htmlFor="email">
              아이디
            </label>
            <input
              className="login-input"
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="아이디"
              required
            />

            <label className="sr-only" htmlFor="password">
              비밀번호
            </label>
            <input
              className="login-input"
              id="password"
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호"
              required
            />

            <div className="flex items-center justify-between py-2">
              <label className="flex cursor-pointer items-center text-sm text-voronoi-gray-800">
                <input
                  className="h-4 w-4 cursor-pointer rounded border-voronoi-gray-300 text-voronoi-orange accent-voronoi-orange focus:ring-voronoi-orange"
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(event) => setRememberEmail(event.target.checked)}
                />
                <span className="ml-2">아이디 저장</span>
              </label>

              <button className="text-sm text-voronoi-gray-800 transition hover:text-voronoi-orange" type="button">
                비밀번호 초기화
              </button>
            </div>

            {message ? <p className="rounded-md bg-voronoi-orange/10 px-3 py-2 text-sm text-voronoi-orange">{message}</p> : null}

            <div className="pt-2">
              <button className="login-submit" disabled={submitting}>
                {submitting ? "처리 중" : "로그인"}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <button
              className="text-sm text-voronoi-gray-500 transition hover:text-voronoi-gray-900"
              type="button"
              onClick={onRegisterClick}
            >
              공급업체등록
            </button>
          </div>
        </div>
      </section>

      <section className="login-visual relative hidden overflow-hidden bg-voronoi-gray-900 lg:block lg:w-[60%]">
        <div className="absolute right-8 top-12 z-10 flex items-center gap-3 xl:right-12">
          <img className="h-12 brightness-0 invert" src="/logos/1_vrn_logo_orange.png" />
        </div>
      </section>
    </main>
  );
}
