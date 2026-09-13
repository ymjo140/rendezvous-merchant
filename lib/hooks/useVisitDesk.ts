"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { b2cOrigin } from "@/lib/utils/appUrl";
import { type ApprovalResponse, type QrResponse, type QueueResponse, type VisitRequest,
  liveQrUrl, remainingMs, VisitApiError, visitApi } from "@/lib/visits/api";

type TimedRequest = VisitRequest & { deadline: number };
type State = {
  scope: string; status: "connecting" | "ready" | "signed_out" | "forbidden";
  storeName: string; qr: { url: string; deadline: number } | null; items: TimedRequest[] | null;
  qrBusy: boolean; listBusy: boolean; approving: string | null; qrError: string; listError: string; notice: string;
};
const empty = (scope: string): State => ({ scope, status: "connecting", storeName: "",
  qr: null, items: null, qrBusy: false, listBusy: false, approving: null, qrError: "", listError: "", notice: "" });
type Actions = { qr: () => void; list: () => void; approve: (id: string, createdAt: string) => void };

export function useVisitDesk(storeId: string) {
  const [epoch, setEpoch] = useState(0);
  const [visible, setVisible] = useState(true);
  const [now, setNow] = useState(0);
  const scope = `${storeId}:${epoch}:${visible}`;
  const [state, setState] = useState<State>(() => empty(scope));
  const actions = useRef<Actions | null>(null);

  useEffect(() => {
    const visibility = () => setVisible(!document.hidden);
    const resume = () => setEpoch(value => value + 1);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pageshow", resume);
    window.addEventListener("focus", resume);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pageshow", resume);
      window.removeEventListener("focus", resume);
    };
  }, []);

  useEffect(() => {
    if (!visible || !/^[1-9]\d*$/.test(storeId)) return;
    let active = true, blocked = false, actor: string | null = null, token = "", authVersion = 0;
    let qrSequence = 0, listSequence = 0, qrDue = 0, listDue = 0;
    let qrController: AbortController | null = null, listController: AbortController | null = null;
    let approvalController: AbortController | null = null;
    let items: TimedRequest[] = [];
    const update = (patch: Partial<State>) => {
      if (active) setState(prev => ({ ...(prev.scope === scope ? prev : empty(scope)), ...patch }));
    };
    const abortAll = () => {
      qrController?.abort(); listController?.abort(); approvalController?.abort();
      qrController = listController = approvalController = null;
      ++qrSequence; ++listSequence;
    };
    const stop = (status: "signed_out" | "forbidden") => {
      blocked = true; token = ""; items = []; abortAll();
      update({ ...empty(scope), status });
    };
    const signOut = () => stop("signed_out");
    window.addEventListener("merchant:sign-out", signOut);

    const loadQr = async (force = false) => {
      if (!active || blocked || !token || (qrController && !force)) return;
      qrController?.abort();
      const controller = new AbortController(); qrController = controller;
      const sequence = ++qrSequence, started = performance.now();
      update({ qr: null, qrBusy: true, qrError: "" });
      try {
        const data = await visitApi<QrResponse>(`/api/merchant/stores/${storeId}/checkin-qr`, token, controller.signal, "POST");
        if (!active || blocked || sequence !== qrSequence) return;
        const ttl = remainingMs(data.server_time, data.expires_at, performance.now() - started);
        if (ttl <= 0 || ttl > 180000) throw new Error("Invalid QR expiry");
        const url = liveQrUrl(data, storeId, b2cOrigin());
        setNow(performance.now());
        update({ qr: { url, deadline: performance.now() + ttl } });
        qrDue = performance.now() + Math.min(120000, Math.max(1000, ttl - 30000));
      } catch (error) {
        if (!active || blocked || sequence !== qrSequence) return;
        if (error instanceof VisitApiError && [401, 403].includes(error.status)) stop(error.status === 401 ? "signed_out" : "forbidden");
        else { update({ qr: null, qrError: "QR을 발급하지 못했어요. 다시 시도하거나 현장 승인을 이용해주세요." }); qrDue = performance.now() + 15000; }
      } finally {
        if (active && !blocked && sequence === qrSequence) { qrController = null; update({ qrBusy: false }); }
      }
    };

    const loadList = async (force = false) => {
      if (!active || blocked || !token || (listController && !force)) return;
      listController?.abort();
      const controller = new AbortController(); listController = controller;
      const sequence = ++listSequence, started = performance.now();
      update({ listBusy: true, listError: "" });
      try {
        const data = await visitApi<QueueResponse>(`/api/merchant/stores/${storeId}/visit-requests`, token, controller.signal);
        if (!active || blocked || sequence !== listSequence) return;
        if (String(data.store.id) !== storeId || !Array.isArray(data.items) || !Number.isFinite(Date.parse(data.server_time))) throw new Error("Invalid store response");
        const elapsed = performance.now() - started;
        items = data.items.map(item => {
          if (typeof item.id !== "string" || !/^[A-F0-9]{8}$/.test(item.verification_code)) throw new Error("Invalid request");
          return { ...item, deadline: performance.now() + remainingMs(data.server_time, item.expires_at, elapsed) };
        });
        setNow(performance.now());
        update({ storeName: data.store.name, items });
      } catch (error) {
        if (!active || blocked || sequence !== listSequence) return;
        if (error instanceof VisitApiError && [401, 403].includes(error.status)) stop(error.status === 401 ? "signed_out" : "forbidden");
        else { items = []; update({ items: null, listError: "대기 목록을 확인하지 못했어요. 새로고침해주세요." }); }
      } finally {
        if (active && !blocked && sequence === listSequence) {
          listController = null; listDue = performance.now() + 5000; update({ listBusy: false });
        }
      }
    };

    const approve = async (id: string, createdAt: string) => {
      const item = items.find(row => row.id === id && row.created_at === createdAt && row.deadline > performance.now());
      if (!active || blocked || !token || !item || approvalController) return;
      const controller = new AbortController(); approvalController = controller;
      update({ approving: id, notice: "" });
      try {
        const result = await visitApi<ApprovalResponse>(`/api/merchant/visit-requests/${encodeURIComponent(id)}/approve`, token, controller.signal, "POST", { expected_created_at: item.created_at });
        if (!active || blocked || controller.signal.aborted) return;
        if (!["pending", "verified"].includes(result.status)) throw new Error("Invalid approval result");
        items = items.filter(row => row.id !== id);
        update({ items, notice: result.already ? "이미 확인된 방문이에요. 중복으로 기록하지 않았어요."
          : `${item.name || "손님"}님의 방문을 확인했어요.${result.status === "pending" ? " 공동 방문은 다른 크루 멤버의 확인을 기다리고 있어요." : ""}` });
      } catch (error) {
        if (!active || blocked || controller.signal.aborted) return;
        if (error instanceof VisitApiError && error.status === 401) stop("signed_out");
        else update({ notice: error instanceof VisitApiError && error.status === 410 ? "요청이 만료됐어요. 손님에게 다시 요청해달라고 안내해주세요."
          : error instanceof VisitApiError && error.status === 409 ? "손님이 요청을 갱신했어요. 새 요청을 다시 확인해주세요."
          : error instanceof VisitApiError && [403, 404].includes(error.status) ? "이 요청은 승인할 수 없어요. 목록과 손님 화면을 다시 확인해주세요."
          : "처리 결과를 확인하지 못했어요. 손님 화면을 확인하고 목록을 새로고침해주세요." });
      } finally {
        if (active && !blocked) { approvalController = null; update({ approving: null }); void loadList(true); }
      }
    };

    const sessionChanged = (session: Session | null) => {
      if (!active || blocked) return;
      if (!session || (actor && actor !== session.user.id)) { stop("signed_out"); return; }
      token = session.access_token;
      if (!actor) {
        actor = session.user.id;
        update({ status: "ready" });
        void loadQr(); void loadList();
      }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      ++authVersion; sessionChanged(session);
    });
    const initialVersion = authVersion;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active || blocked || authVersion !== initialVersion) return;
      if (error) stop("signed_out"); else sessionChanged(data.session);
    }).catch(() => { if (active) stop("signed_out"); });
    const controls = { qr: () => { void loadQr(true); }, list: () => { void loadList(true); }, approve: (id: string, createdAt: string) => { void approve(id, createdAt); } };
    actions.current = controls;
    const timer = setInterval(() => {
      if (!active || blocked) return;
      const time = performance.now(); setNow(time);
      if (actor && time >= qrDue) void loadQr();
      if (actor && time >= listDue) void loadList();
    }, 1000);
    return () => {
      active = false; abortAll(); clearInterval(timer); subscription.unsubscribe();
      window.removeEventListener("merchant:sign-out", signOut);
      if (actions.current === controls) actions.current = null;
    };
  }, [storeId, scope, visible]);

  const current = state.scope === scope && visible ? state : empty(scope);
  return { ...current, now, visible, validStore: /^[1-9]\d*$/.test(storeId),
    qr: current.qr && current.qr.deadline > now ? current.qr : null,
    items: current.items?.filter(item => item.deadline > now) ?? null,
    refreshQr: () => actions.current?.qr(), refreshList: () => actions.current?.list(),
    approve: (id: string, createdAt: string) => actions.current?.approve(id, createdAt), retry: () => setEpoch(value => value + 1) };
}
