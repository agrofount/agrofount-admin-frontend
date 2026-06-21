import { useContext, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import { apiClient } from "../lib/apiClient";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaChallenge, setMfaChallenge] = useState(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { token, setToken, navigate } = useContext(ShopContext);

  const mfaVerifyPath =
    import.meta.env.VITE_ADMIN_MFA_VERIFY_PATH || "/auth/admin/mfa/verify";

  const getOtpSecret = (otpauthUrl) => {
    try {
      return new URL(otpauthUrl).searchParams.get("secret") || "";
    } catch {
      return "";
    }
  };

  const completeLogin = (responseData) => {
    if (responseData?.token) {
      setToken(responseData.token, responseData.refreshToken);
      return true;
    }

    if (responseData?.mfaSetupRequired || responseData?.mfaRequired) {
      setMfaChallenge({
        mode: responseData.mfaSetupRequired ? "setup" : "signin",
        challengeId: responseData.challengeId,
        otpauthUrl: responseData.otpauthUrl || "",
      });
      toast.info(
        responseData.mfaSetupRequired
          ? "Set up MFA, then enter the 6-digit code."
          : "Enter your MFA code to continue."
      );
      return true;
    }

    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setProcessing(true);
      const response = await apiClient.post("/auth/admin/login", {
        email,
        password,
      });

      if (!completeLogin(response.data)) {
        toast.error("Login response did not include a token or MFA challenge.");
      }
    } catch (error) {
      if (
        error.status === 401 &&
        String(error.message).toLowerCase().includes("mfa code")
      ) {
        setMfaChallenge({ mode: "signin" });
        setMfaCode("");
        toast.info("Enter your 2FA code to complete login.");
      } else {
        toast.error(error.message);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleMfaVerify = async (e) => {
    e.preventDefault();

    try {
      setProcessing(true);
      const response =
        mfaChallenge?.mode === "setup"
          ? await apiClient.post(mfaVerifyPath, {
              challengeId: mfaChallenge.challengeId,
              code: mfaCode,
            })
          : await apiClient.post("/auth/admin/login", {
              email,
              password,
              mfaCode,
            });

      if (!completeLogin(response.data)) {
        toast.error("MFA verification did not return a session token.");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token, navigate]);

  const otpSecret = getOtpSecret(mfaChallenge?.otpauthUrl);
  const codeDigits = Array.from(
    { length: 6 },
    (_, index) => mfaCode[index] || ""
  );
  const isMfaSetup = mfaChallenge?.mode === "setup";

  if (mfaChallenge) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f5fbf6] px-3 py-3 text-[#10233f]">
        <div className="absolute left-8 top-28 hidden grid-cols-6 gap-2.5 opacity-20 md:grid">
          {Array.from({ length: 42 }).map((_, index) => (
            <span
              key={index}
              className="h-1 w-1 rounded-full bg-[#9fd7ad]"
            />
          ))}
        </div>
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-[#dff4e4]" />
        <div className="absolute bottom-0 left-0 h-36 w-36 rounded-tr-[7rem] bg-[#bfe8c9]/35" />
        <div className="absolute right-[-5rem] top-20 hidden h-60 w-60 rotate-[-28deg] rounded-[2.5rem] border-[1.4rem] border-[#cfead7]/35 lg:block" />

        <div className="relative mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-lg items-center justify-center">
          <form
            onSubmit={handleMfaVerify}
            className="w-full max-w-[400px] rounded-xl border border-[#d8e7dc] bg-white/95 px-5 py-4 shadow-[0_12px_30px_rgba(16,35,63,0.09)] backdrop-blur sm:px-7"
          >
            <div className="flex flex-col items-center text-center">
              <img
                src={assets.agrofount_logo}
                className="mb-1.5 w-20"
                alt="Agrofount"
              />

              <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#e7f6ea] text-[#078a35]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3 5 6v5c0 4.42 2.99 8.53 7 9.75 4.01-1.22 7-5.33 7-9.75V6l-7-3Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.75 11.4V9.7a2.25 2.25 0 0 1 4.5 0v1.7M9.3 11.4h5.4v4.45H9.3V11.4Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h1 className="text-lg font-bold tracking-normal text-[#063b2b]">
                {isMfaSetup ? "Two-Factor Authentication" : "Enter 2FA Code"}
              </h1>
              <p className="mt-1 max-w-xs text-[11px] leading-4 text-[#667085]">
                {isMfaSetup ? (
                  <>
                    Add an extra layer of security to your account.
                    <br />
                    Scan the QR code below with your authenticator app.
                  </>
                ) : (
                  "Enter the 6-digit code from your authenticator app to sign in."
                )}
              </p>

              {isMfaSetup && mfaChallenge.otpauthUrl && (
                <div className="mt-2.5 rounded-lg border border-[#bfe8c9] bg-white p-2 shadow-[0_5px_14px_rgba(16,35,63,0.08)]">
                  <QRCodeSVG
                    value={mfaChallenge.otpauthUrl}
                    size={108}
                    marginSize={1}
                    level="M"
                    aria-label="Authenticator setup QR code"
                  />
                </div>
              )}
            </div>

            {isMfaSetup && (
              <>
                <div className="my-3 flex items-center gap-3 text-[10px] font-semibold text-[#7a8496]">
                  <span className="h-px flex-1 bg-[#d8dde7]" />
                  OR
                  <span className="h-px flex-1 bg-[#d8dde7]" />
                </div>

                <div>
                  <p className="mb-1 text-[11px] font-bold text-[#10233f]">
                    Can&apos;t scan the QR code?
                  </p>
                  <div className="flex items-center justify-between gap-2 rounded-md border border-[#cfded4] bg-[#f9fbfa] px-2.5 py-2">
                    <span className="break-all font-mono text-[11px] tracking-[0.18em] text-[#667085]">
                      {otpSecret || "Setup key unavailable"}
                    </span>
                    <button
                      type="button"
                      className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#078a35]"
                      onClick={() => {
                        navigator.clipboard?.writeText(otpSecret);
                        toast.success("Setup key copied");
                      }}
                      disabled={!otpSecret}
                    >
                      Copy
                    </button>
                  </div>
                  <p className="mt-1 text-center text-[10px] text-[#667085]">
                    Enter this key manually in your authenticator app.
                  </p>
                </div>
              </>
            )}

            <div className="mt-3">
              <label
                htmlFor="mfaCode"
                className="mb-1.5 block text-[11px] font-bold text-[#10233f]"
              >
                Enter verification code
              </label>
              <input
                id="mfaCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="sr-only"
                onChange={(e) =>
                  setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                value={mfaCode}
                minLength={6}
                maxLength={6}
                required
                autoFocus
              />
              <div
                className="grid grid-cols-6 gap-1.5 sm:gap-2.5"
                onClick={() => document.getElementById("mfaCode")?.focus()}
              >
                {codeDigits.map((digit, index) => (
                  <button
                    key={index}
                    type="button"
                    className="flex h-9 w-full items-center justify-center rounded-md border border-[#119645] bg-white text-sm font-bold text-[#10233f] shadow-sm sm:h-10"
                    aria-label={`Digit ${index + 1}`}
                    onClick={() =>
                      document.getElementById("mfaCode")?.focus()
                    }
                  >
                    {digit || ""}
                  </button>
                ))}
              </div>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-[#667085]">
                <span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#078a35] text-[8px] text-white">
                  ✓
                </span>
                Enter the 6-digit code from your authenticator app.
              </p>
            </div>

            <button
              type="submit"
              disabled={processing || mfaCode.length !== 6}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-[#078f39] px-5 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(7,143,57,0.2)] transition hover:bg-[#067d32] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? "Processing..." : "Verify & Continue"}
            </button>

            {isMfaSetup && (
              <div className="mt-4 flex items-center justify-center gap-2.5 rounded-lg border border-[#d8dde7] px-3 py-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#078a35] text-sm font-bold text-[#078a35]">
                  ?
                </span>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-[#10233f]">
                    Need help setting up MFA?
                  </p>
                  <a
                    href="https://support.google.com/accounts/answer/1066447"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-[#067d32] underline"
                  >
                    View setup instructions
                    <span aria-hidden="true"> ›</span>
                  </a>
                </div>
              </div>
            )}

            <button
              type="button"
              className="mx-auto mt-4 flex items-center gap-1.5 text-[11px] font-bold text-[#067d32]"
              onClick={() => {
                setMfaChallenge(null);
                setMfaCode("");
              }}
            >
              <span aria-hidden="true">←</span>
              Back to login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5fbf6] px-4 py-5 text-[#111827]">
      <div className="absolute left-20 top-48 hidden grid-cols-8 gap-3 opacity-25 md:grid">
        {Array.from({ length: 64 }).map((_, index) => (
          <span key={index} className="h-1 w-1 rounded-full bg-[#9fd7ad]" />
        ))}
      </div>
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#dff4e4]" />
      <div className="absolute bottom-0 left-0 h-52 w-52 rounded-tr-[9rem] bg-[#bfe8c9]/45" />
      <div className="absolute right-[-7rem] top-28 hidden h-80 w-80 rotate-[-24deg] rounded-[3rem] border-[2rem] border-[#cfead7]/35 lg:block" />
      <div className="absolute right-36 top-64 hidden h-16 w-16 rounded-2xl bg-[#cfead7]/35 lg:block" />

      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-2xl items-center justify-center">
        <form
          className="w-full max-w-[470px] rounded-2xl border border-[#edf1ee] bg-white/95 px-6 py-7 shadow-[0_18px_48px_rgba(16,35,63,0.1)] backdrop-blur sm:px-10"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col items-center text-center">
            <a
              href="https://agrofount.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={assets.agrofount_logo}
                className="w-28"
                alt="Agrofount"
              />
            </a>

            <h1 className="mt-5 text-2xl font-bold tracking-normal text-[#111827]">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-[#667085]">
              Login to your Agrofount admin account
            </p>

            <div className="mt-5 flex w-full items-center gap-3">
              <span className="h-px flex-1 bg-[#d8dde7]" />
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8e7dc] bg-[#f0f8f2] text-[#078a35] shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12v10H6V10Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="h-px flex-1 bg-[#d8dde7]" />
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor="email"
              className="mb-2 block text-xs font-bold text-[#111827]"
            >
              Email address
            </label>
            <div className="flex items-center gap-3 rounded-lg border border-[#d8dde7] bg-white px-3.5 py-3 shadow-sm focus-within:border-[#078a35]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e7f6ea] text-sm text-[#078a35]">
                @
              </span>
              <input
                id="email"
                type="email"
                className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none"
                placeholder="dayo.akinbami@agrofount.com"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
              />
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-4">
              <label htmlFor="password" className="text-xs font-bold">
                Password
              </label>
              <button
                type="button"
                className="text-xs font-bold text-[#078a35]"
              >
                Forgot password?
              </button>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-[#d8dde7] bg-white px-3.5 py-3 shadow-sm focus-within:border-[#078a35]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e7f6ea] text-[#078a35]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12v10H6V10Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none"
                placeholder="••••••••••••"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                required
              />
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f2f4f7] text-sm text-[#7a8496]"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                ◉
              </button>
            </div>
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-xs text-[#4b5565]">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded accent-[#078a35]"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>

          <button
            type="submit"
            disabled={processing}
            className="mt-5 flex w-full items-center justify-center gap-3 rounded-lg bg-[#078f39] px-6 py-3 text-base font-bold text-white shadow-[0_8px_20px_rgba(7,143,57,0.22)] transition hover:bg-[#067d32] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing ? (
              "Processing..."
            ) : (
              <>
                Login
                <span aria-hidden="true" className="text-xl leading-none">
                  →
                </span>
              </>
            )}
          </button>

          <div className="my-5 flex items-center gap-3 text-xs font-semibold text-[#667085]">
            <span className="h-px flex-1 bg-[#d8dde7]" />
            Or continue with
            <span className="h-px flex-1 bg-[#d8dde7]" />
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#d8dde7] bg-white px-4 py-2.5 text-sm font-bold text-[#111827] shadow-sm"
          >
            <span className="text-base font-bold text-[#4285F4]">G</span>
            Login with Google
          </button>

          <p className="mt-5 text-center text-xs text-[#667085]">
            Don&apos;t have an account?{" "}
            <span className="font-bold text-[#078a35]">
              Contact administrator
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
