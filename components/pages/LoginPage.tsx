"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logAction } from "@/lib/analytics/analyticsClient";
import { actionMap } from "@/domain/analytics/actionMap";
import { supabase } from "@/lib/supabase/client";
import { setToken } from "@/lib/auth/tokenStore";
import { isValidBizNo, normalizeBizNo, formatBizNo } from "@/lib/bizno";
import { fetchWithAuth } from "@/lib/api/client";

type BizVerifyResult = { valid: boolean | null; status?: string; message?: string };

const DEV_EMAIL = "dev@rendezvous.app";

export function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [bizNo, setBizNo] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** 인증 성공 후 공통 라우팅: 토큰 저장 → 내 가게 있으면 콘솔, 없으면 온보딩 */
  async function afterAuth(accessToken: string | undefined, userId: string) {
    setToken(accessToken || "dev-token");
    const { data: store } = await supabase
      .from("places")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (!store?.id) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("rendezvous_last_store");
      }
      router.push("/onboarding");
      return;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("rendezvous_last_store", String(store.id));
    }
    router.push(`/stores/${store.id}`);
  }

  function validate(): boolean {
    setError(null);
    if (!email.trim() || !email.includes("@")) {
      setError("올바른 이메일을 입력해주세요.");
      return false;
    }
    if (pw.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return false;
    }
    if (mode === "signup" && pw !== pw2) {
      setError("비밀번호가 서로 달라요.");
      return false;
    }
    if (mode === "signup") {
      // 점주 인증: 사업자등록번호 필수 + 국세청 체크섬 검증
      if (!ownerName.trim()) {
        setError("대표자명을 입력해주세요.");
        return false;
      }
      if (!isValidBizNo(bizNo)) {
        setError("유효하지 않은 사업자등록번호예요. 10자리 번호를 확인해주세요.");
        return false;
      }
    }
    return true;
  }

  async function handleEmailSubmit() {
    if (!validate()) return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError("서버 설정이 없습니다. 관리자에게 문의해주세요.");
      return;
    }
    setLoading(true);
    setNotice(null);
    try {
      if (mode === "signup") {
        // 국세청 사업자등록 상태조회(진위확인) — 미등록/폐업이면 가입 차단.
        // 서비스 장애(unavailable) 시엔 체크섬 검증만으로 진행(가입 후 심사 시 확인).
        let bizVerified: boolean | null = null;
        try {
          const v = await fetchWithAuth<BizVerifyResult>("/api/merchant/verify-business", {
            method: "POST",
            body: JSON.stringify({ business_number: normalizeBizNo(bizNo) }),
          });
          bizVerified = v?.valid ?? null;
          if (v?.valid === false) {
            setError(v.message || "사업자등록번호 확인에 실패했어요. 번호를 다시 확인해주세요.");
            return;
          }
          if (v?.valid === null) {
            setNotice("사업자 진위확인 서비스가 지연되어, 가입 후 심사 단계에서 확인됩니다.");
          }
        } catch {
          // 백엔드 콜드스타트 등 — 체크섬 통과 상태이므로 가입은 진행
          setNotice("사업자 진위확인 서비스가 지연되어, 가입 후 심사 단계에서 확인됩니다.");
        }

        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password: pw,
          options: {
            // 점주 인증 정보 — auth user metadata에 보관(가입 심사/추후 국세청 진위확인용)
            data: {
              business_number: normalizeBizNo(bizNo),
              owner_name: ownerName.trim(),
              business_verified: bizVerified, // true=국세청 확인됨 / null=확인 대기
              role: "merchant",
            },
          },
        });
        if (err) {
          setError(
            err.message.toLowerCase().includes("already")
              ? "이미 가입된 이메일이에요. 로그인해주세요."
              : `가입 실패: ${err.message}`
          );
          return;
        }
        if (data.session && data.user) {
          // 이메일 확인이 꺼진 프로젝트 → 바로 가게 등록(온보딩)
          await afterAuth(data.session.access_token, data.user.id);
          return;
        }
        // 이메일 확인이 켜진 프로젝트 → 안내 후 로그인 탭으로
        setNotice("확인 메일을 보냈어요! 메일의 링크를 누른 뒤 로그인해주세요.");
        setMode("login");
        return;
      }

      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pw,
      });
      if (err || !data?.user) {
        setError("로그인 실패: 이메일 또는 비밀번호를 확인해주세요.");
        return;
      }
      await afterAuth(data.session?.access_token, data.user.id);
    } catch (e) {
      console.error(e);
      setError("처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDevLogin() {
    if (!masterKey.trim()) {
      window.alert("비밀번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        window.alert("수파베이스 환경변수가 없습니다.");
        return;
      }
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: DEV_EMAIL,
        password: masterKey.trim(),
      });
      if (err || !data?.user) {
        if (err) console.error(err);
        window.alert(
          `로그인 실패: dev@rendezvous.app 계정을 확인해주세요.${err?.message ? ` (${err.message})` : ""}`
        );
        return;
      }
      await afterAuth(data.session?.access_token, data.user.id);
    } catch (e) {
      console.error(e);
      window.alert("로그인 실패: dev@rendezvous.app 계정을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          <span className="text-brand">랑데부</span> 사장님 콘솔
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          가게를 등록하고 앱 손님의 예약·핫딜을 관리하세요.
        </p>

        {/* 이메일 로그인/가입 */}
        <div className="mt-6">
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
            <button
              type="button"
              className={`rounded-lg py-2 transition-colors ${
                mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
              onClick={() => {
                setMode("login");
                setError(null);
              }}
            >
              로그인
            </button>
            <button
              type="button"
              className={`rounded-lg py-2 transition-colors ${
                mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
            >
              회원가입
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <Input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="비밀번호 (6자 이상)"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
            {mode === "signup" && (
              <>
                <Input
                  type="password"
                  placeholder="비밀번호 확인"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                />
                {/* 점주 인증 — 사업자 정보 */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="text-xs font-semibold text-slate-600">🏪 점주 인증</div>
                  <Input
                    placeholder="사업자등록번호 (123-45-67890)"
                    value={bizNo}
                    onChange={(e) => setBizNo(e.target.value)}
                    onBlur={() => setBizNo(formatBizNo(bizNo))}
                    inputMode="numeric"
                  />
                  <Input
                    placeholder="대표자명"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400">
                    사업자등록번호는 형식 검증 후 가입 심사에 사용됩니다.
                  </p>
                </div>
              </>
            )}
            {error && <p className="text-xs text-rose-500">{error}</p>}
            {notice && <p className="text-xs text-emerald-600">{notice}</p>}
            <Button className="w-full" onClick={handleEmailSubmit} disabled={loading}>
              {loading ? "처리 중..." : mode === "signup" ? "가입하고 가게 등록하기" : "로그인"}
            </Button>
            {mode === "signup" && (
              <p className="text-center text-[11px] text-slate-400">
                가입 후 바로 가게 등록(온보딩)으로 이동해요.
              </p>
            )}
          </div>
        </div>

        {/* 개발 전용 로그인(가짜 카카오 + 마스터키) — 프로덕션 빌드에서는 제외.
            로컬(npm run dev)에서는 그대로 노출되어 확인용으로 사용 가능. */}
        {process.env.NODE_ENV !== "production" && (
          <>
            <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              <span>또는 (개발용)</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <Button
              className="w-full bg-[#FEE500] text-black hover:bg-[#FEE500]/90"
              onClick={async () => {
                try {
                  await logAction({ action_type: actionMap.login_click });
                } catch {
                  // ignore logging failures in dev
                }
                router.push("/auth/callback/kakao?code=dev-kakao");
              }}
            >
              카카오 로그인 (개발용)
            </Button>

            <div className="mt-6 space-y-3">
              <div className="text-sm font-medium text-slate-700">🔧 개발자용 마스터키</div>
              <Input
                type="password"
                placeholder="Master Key"
                value={masterKey}
                onChange={(event) => setMasterKey(event.target.value)}
              />
              <Button variant="secondary" className="w-full" onClick={handleDevLogin} disabled={loading}>
                {loading ? "로그인 중..." : "🚀 즉시 진입"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
