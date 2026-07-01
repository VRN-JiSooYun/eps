import { FormEvent, useEffect, useState } from "react";
import { Button, Checkbox, ConfigProvider, Input } from "antd";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { listEstimateRequests, login } from "./api";
import { MainPage } from "./pages/Main";
import Register from "./pages/Register";
import type { AuthResponse, EstimateRequest, Supplier } from "./types";
import TestPage from "./pages/Test";
import { assetUrl, routerBasename } from "./runtimeConfig";

const tokenKey = "eps.auth.token";
const supplierKey = "eps.auth.supplier";
const rememberedEmailKey = "eps.auth.rememberedEmail";

export function App() {
  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            headerSplitColor: "transparent",
          },
        },
        token: {
          borderRadius: 6,
          colorPrimary: "#E85324",
          fontFamily:
            'Pretendard, "Noto Sans KR", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      }}
    >
      <BrowserRouter basename={routerBasename}>
        <AppRoutes />
      </BrowserRouter>
    </ConfigProvider>
  );
}

function AppRoutes() {
  const [token, setToken] = useState(
    () => localStorage.getItem(tokenKey) ?? "",
  );
  const [supplier, setSupplier] = useState<Supplier | null>(() => {
    const raw = localStorage.getItem(supplierKey);
    return raw ? (JSON.parse(raw) as Supplier) : null;
  });
  const [estimateRequests, setEstimateRequests] = useState<EstimateRequest[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const isAuthed = Boolean(token && supplier);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    listEstimateRequests(token)
      .then((data) => setEstimateRequests(data.estimateRequests))
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
    setEstimateRequests([]);
    navigate("/");
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthed && supplier ? (
            <MainPage
              supplier={supplier}
              token={token}
              estimateRequests={estimateRequests}
              loading={loading}
              message={message}
              onEstimateRequestResponded={(requestId) => {
                setEstimateRequests((current) =>
                  current.map((request) =>
                    request.id === requestId
                      ? { ...request, status: "completed" }
                      : request,
                  ),
                );
              }}
              onLogout={clearSession}
            />
          ) : (
            <AuthPanel
              onRegisterClick={() => navigate("/register")}
              onAuth={saveSession}
              message={message}
              setMessage={setMessage}
            />
          )
        }
      />
      <Route
        path="/register"
        element={isAuthed ? <Navigate to="/" replace /> : <Register />}
      />
      <Route path="/test" element={<TestPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AuthPanel({
  onRegisterClick,
  onAuth,
  message,
  setMessage,
}: {
  onRegisterClick: () => void;
  onAuth: (auth: AuthResponse) => void;
  message: string;
  setMessage: (message: string) => void;
}) {
  const [email, setEmail] = useState(
    () => localStorage.getItem(rememberedEmailKey) ?? "",
  );
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(() =>
    Boolean(localStorage.getItem(rememberedEmailKey)),
  );
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
      setMessage(
        error instanceof Error ? error.message : "요청 처리에 실패했습니다.",
      );
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
              <img
                className="h-14"
                src={assetUrl("logos/1_vrn_ci.png")}
              ></img>
            </div>
            <h1 className="mb-2 text-4xl font-normal tracking-normal text-black">
              Login
            </h1>
            <p className="text-lg font-bold tracking-normal text-black">
              보로노이 파트너 플랫폼
            </p>
          </header>

          <form className="space-y-4" onSubmit={submit}>
            <Input
              className="login-input"
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="아이디"
              required
            />

            <Input.Password
              className="login-input !flex !items-center"
              id="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호"
              required
            />

            <div className="flex items-center justify-between py-2">
              <Checkbox
                checked={rememberEmail}
                onChange={(event) => setRememberEmail(event.target.checked)}
              >
                아이디 저장
              </Checkbox>

              <Button
                className="!text-voronoi-gray-800 transition hover:!text-voronoi-orange"
                type="text"
                size="small"
                onClick={() =>
                  setMessage("관리자에게 문의하여 비밀번호를 초기화하세요.")
                }
              >
                비밀번호 초기화
              </Button>
            </div>

            {message ? (
              <p className="rounded-md bg-voronoi-orange/10 px-3 py-2 text-sm text-voronoi-orange">
                {message}
              </p>
            ) : null}

            <div className="pt-2">
              <Button
                className="login-submit"
                type="primary"
                htmlType="submit"
                loading={submitting}
                disabled={submitting}
              >
                {submitting ? "처리 중" : "로그인"}
              </Button>
            </div>
          </form>

          <div className="mt-8">
            <Button
              className="text-sm !text-voronoi-gray-500 transition hover:!text-voronoi-gray-900"
              type="text"
              onClick={onRegisterClick}
            >
              공급업체등록
            </Button>
          </div>
        </div>
      </section>

      <section className="login-visual relative hidden overflow-hidden bg-voronoi-gray-900 lg:block lg:w-[60%]">
        <div className="absolute right-8 top-12 z-10 flex items-center gap-3 xl:right-12">
          <img
            className="h-12 brightness-0 invert"
            src={assetUrl("logos/1_vrn_logo_orange.png")}
          />
        </div>
      </section>
    </main>
  );
}
