"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initKakaoSDK, kakaoLogin } from "@/lib/kakao";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { id: number; name: string; email: string; is_admin: boolean }) => void;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 로그인 폼
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // 회원가입 폼
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");

  // 이메일 인증 상태
  const [verificationCode, setVerificationCode] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeSentMessage, setCodeSentMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  // 비밀번호 표시 상태
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterPasswordConfirm, setShowRegisterPasswordConfirm] = useState(false);

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const resetForm = () => {
    setLoginEmail("");
    setLoginPassword("");
    setRegisterName("");
    setRegisterEmail("");
    setRegisterPassword("");
    setRegisterPasswordConfirm("");
    setVerificationCode("");
    setIsEmailVerified(false);
    setCodeSentMessage("");
    setCountdown(0);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 이메일 인증 코드 발송
  const handleSendVerification = async () => {
    if (!registerEmail) {
      setError("이메일을 입력해주세요.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerEmail)) {
      setError("올바른 이메일 형식이 아닙니다.");
      return;
    }

    setIsSendingCode(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registerEmail }),
      });

      const data = await res.json();

      if (data.success) {
        setCodeSentMessage("인증 코드가 발송되었습니다.");
        setCountdown(60); // 60초 카운트다운
      } else {
        setError(data.error || "인증 코드 발송에 실패했습니다.");
      }
    } catch (err) {
      console.error("Send verification error:", err);
      setError(`인증 코드 발송 중 오류가 발생했습니다. ${err instanceof Error ? err.message : ""}`);
    } finally {
      setIsSendingCode(false);
    }
  };

  // 인증 코드 확인
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("6자리 인증 코드를 입력해주세요.");
      return;
    }

    setIsVerifyingCode(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registerEmail, code: verificationCode }),
      });

      const data = await res.json();

      if (data.success) {
        setIsEmailVerified(true);
        setCodeSentMessage("");
      } else {
        setError(data.error || "인증 코드 확인에 실패했습니다.");
      }
    } catch (err) {
      console.error("Verify code error:", err);
      setError(`인증 확인 중 오류가 발생했습니다. ${err instanceof Error ? err.message : ""}`);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // 카카오 로그인 핸들러
  const handleKakaoLogin = async () => {
    setError("");
    initKakaoSDK();

    // 네이티브 앱에서는 모달을 먼저 닫아야 딥링크 복귀 시 모달이 안 보임
    // 웹에서는 페이지 이동이 일어나므로 onClose 불필요
    const isNative = (window as unknown as Record<string, unknown> & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() === true;
    if (isNative) {
      onClose();
    }
    await kakaoLogin();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (data.success) {
        onLoginSuccess(data.data);
        handleClose();
      } else {
        setError(data.error || "로그인에 실패했습니다.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(`로그인 중 오류가 발생했습니다. ${err instanceof Error ? err.message : ""}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isEmailVerified) {
      setError("이메일 인증이 필요합니다.");
      return;
    }

    if (registerPassword !== registerPasswordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (registerPassword.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // 회원가입 성공 후 자동 로그인
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: registerEmail, password: registerPassword }),
        });
        const loginData = await loginRes.json();

        if (loginData.success) {
          onLoginSuccess(loginData.data);
          handleClose();
        } else {
          setTab("login");
          setLoginEmail(registerEmail);
          toast.success("회원가입이 완료되었습니다. 로그인해주세요.");
        }
      } else {
        setError(data.error || "회원가입에 실패했습니다.");
      }
    } catch (err) {
      console.error("Register error:", err);
      setError(`회원가입 중 오류가 발생했습니다. ${err instanceof Error ? err.message : ""}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">여의도 한끼</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as "login" | "register"); setError(""); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">로그인</TabsTrigger>
            <TabsTrigger value="register">회원가입</TabsTrigger>
          </TabsList>

          {/* 로그인 탭 */}
          <TabsContent value="login">
            {/* 카카오 로그인 */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleKakaoLogin}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-medium text-[15px] transition-colors"
                style={{ backgroundColor: "#FEE500", color: "#000000" }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9 0.6C4.029 0.6 0 3.713 0 7.551C0 9.942 1.558 12.048 3.931 13.303L2.933 16.909C2.844 17.221 3.213 17.466 3.479 17.278L7.736 14.41C8.151 14.462 8.572 14.502 9 14.502C13.971 14.502 18 11.389 18 7.551C18 3.713 13.971 0.6 9 0.6Z"
                    fill="#000000"
                  />
                </svg>
                카카오로 로그인
              </button>
            </div>

            {/* 구분선 */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">또는</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="이메일"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Input
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="비밀번호"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  "로그인"
                )}
              </Button>
            </form>
          </TabsContent>

          {/* 회원가입 탭 */}
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4 pt-4">
              {/* 이름 */}
              <div>
                <Input
                  type="text"
                  placeholder="이름"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                />
              </div>

              {/* 이메일 + 인증 버튼 */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="이메일"
                    value={registerEmail}
                    onChange={(e) => {
                      setRegisterEmail(e.target.value);
                      setIsEmailVerified(false);
                      setCodeSentMessage("");
                      setVerificationCode("");
                    }}
                    disabled={isEmailVerified}
                    required
                    className="flex-1"
                  />
                  {isEmailVerified ? (
                    <div className="flex items-center justify-center w-20 text-green-600">
                      <Check className="w-5 h-5 mr-1" />
                      <span className="text-sm">완료</span>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendVerification}
                      disabled={isSendingCode || countdown > 0}
                      className="w-20"
                    >
                      {isSendingCode ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : countdown > 0 ? (
                        `${countdown}초`
                      ) : (
                        "인증"
                      )}
                    </Button>
                  )}
                </div>

                {/* 인증 코드 입력 */}
                {codeSentMessage && !isEmailVerified && (
                  <div className="space-y-2">
                    <p className="text-sm text-green-600">{codeSentMessage}</p>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="6자리 인증 코드"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleVerifyCode}
                        disabled={isVerifyingCode || verificationCode.length !== 6}
                        className="w-20"
                      >
                        {isVerifyingCode ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "확인"
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {isEmailVerified && (
                  <p className="text-sm text-green-600 flex items-center">
                    <Check className="w-4 h-4 mr-1" />
                    이메일 인증 완료
                  </p>
                )}
              </div>

              {/* 비밀번호 */}
              <div className="relative">
                <Input
                  type={showRegisterPassword ? "text" : "password"}
                  placeholder="비밀번호 (6자 이상)"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showRegisterPasswordConfirm ? "text" : "password"}
                  placeholder="비밀번호 확인"
                  value={registerPasswordConfirm}
                  onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPasswordConfirm(!showRegisterPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showRegisterPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                disabled={isLoading || !isEmailVerified}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    가입 중...
                  </>
                ) : (
                  "회원가입"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
