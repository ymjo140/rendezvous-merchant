"use client";

import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { useVisitDesk } from "@/lib/hooks/useVisitDesk";

function countdown(deadline: number, now: number) {
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function VisitDeskPage({ storeId }: { storeId: string }) {
  return <VisitDesk key={storeId} storeId={storeId} />;
}

function VisitDesk({ storeId }: { storeId: string }) {
  const desk = useVisitDesk(storeId);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (!desk.validStore) return <p role="alert">매장을 다시 선택해주세요.</p>;
  if (desk.status === "signed_out" || desk.status === "forbidden") return <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
    <h1 className="text-xl font-bold">방문 확인</h1>
    <p role="alert" className="mt-4 text-sm text-slate-600">{desk.status === "signed_out" ? "세션이 종료됐거나 계정이 바뀌었어요. 사장님 계정으로 다시 로그인해주세요." : "이 매장의 소유주만 방문을 확인할 수 있어요."}</p>
    <Link className="mt-5 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white" href={desk.status === "signed_out" ? "/login" : "/stores/select"}>
      {desk.status === "signed_out" ? "로그인하기" : "매장 선택하기"}
    </Link>
    <Button variant="ghost" className="ml-2" onClick={desk.retry}>다시 확인</Button>
  </section>;

  return <div className="mx-auto max-w-5xl space-y-5">
    <header>
      <p className="text-sm font-medium text-amber-700">{desk.storeName || "사장님 콘솔"}</p>
      <h1 className="mt-1 text-2xl font-bold">방문 확인</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">손님이 각자 방문을 확인해요. 같은 크루의 멤버 2명 이상이 같은 날 2시간 안에 확인하면 공동 방문 1회로 기록돼요.</p>
    </header>
    {!desk.visible && <p role="status">화면을 다시 열면 최신 QR과 대기 목록을 확인해요.</p>}
    {desk.notice && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{desk.notice}</p>}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 print:hidden">
        <h2 className="font-bold">매장에서 보여줄 QR</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">손님이 카메라로 스캔한 뒤 앱에서 현재 위치를 확인해요.</p>
        <div className="my-5 flex min-h-64 items-center justify-center rounded-xl bg-slate-50 p-2">
          {desk.qr ? <QRCodeSVG value={desk.qr.url} size={248} marginSize={4} level="M" role="img" aria-label="방문 인증 QR" className="h-auto max-w-full" />
            : <p role="status" className="p-6 text-center text-sm leading-6 text-slate-500">{desk.qrBusy || desk.status === "connecting" ? "새 QR을 준비하고 있어요…" : "표시할 수 있는 QR이 없어요."}</p>}
        </div>
        {desk.qr && <p className="text-center text-sm font-semibold tabular-nums text-amber-800">표시 가능 시간 {countdown(desk.qr.deadline, desk.now)}</p>}
        {desk.qrError && <p role="alert" className="mt-3 text-sm leading-6 text-rose-700">{desk.qrError}</p>}
        <Button className="mt-4 w-full" onClick={desk.refreshQr} disabled={desk.qrBusy || desk.status !== "ready"}>새 QR 발급</Button>
        <p className="mt-3 text-xs leading-5 text-slate-500">QR은 약 2분마다 새로 발급해요. 만료된 QR은 숨겨져요. 이 화면을 매장에서 보여주고, 인쇄된 QR은 현장 승인 요청의 입구로 이용해주세요.</p>
      </section>
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-bold">직원 확인 대기 {desk.items ? <span className="text-amber-700">{desk.items.length}명</span> : null}</h2>
          <Button variant="ghost" className="shrink-0 px-2 text-xs" onClick={desk.refreshList} disabled={desk.listBusy || desk.status !== "ready"}>목록 새로고침</Button>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">현장에 있는 손님의 앱 이름과 요청 번호를 대조한 뒤 승인해주세요. 요청은 15분 동안 유효해요.</p>
        {desk.listError ? <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{desk.listError}</p>
          : desk.items === null ? <p role="status" className="py-12 text-center text-sm text-slate-500">대기 목록을 확인하고 있어요…</p>
          : !desk.items.length ? <p className="py-12 text-center text-sm text-slate-500">지금 확인을 기다리는 손님이 없어요.</p>
          : <ul className="mt-5 space-y-3">{desk.items.map(item => <li key={item.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="break-words font-semibold">{item.name || "이름 없는 손님"}</h3>
                <p className="mt-1 text-xs text-slate-500">{item.community_id ? "크루 방문" : "개인 방문"} · {new Date(item.created_at).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" })} 요청</p>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-slate-500">남은 {countdown(item.deadline, desk.now)}</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">현장 확인용 요청 번호</p>
            <p className="mt-1 font-mono text-lg font-bold tracking-widest text-slate-800">{item.verification_code}</p>
            {selected === `${item.id}:${item.created_at}` ? <div className="mt-4 border-t border-slate-100 pt-4">
              <label className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                <input type="checkbox" className="mt-1.5 h-4 w-4 shrink-0" checked={confirmed} disabled={!!desk.approving} onChange={e => setConfirmed(e.target.checked)} />
                손님 화면의 이름·요청 번호와 실제 방문을 확인했어요.
              </label>
              <div className="mt-3 flex gap-2">
                <Button disabled={!confirmed || !!desk.approving} onClick={() => desk.approve(item.id, item.created_at)}>{desk.approving === item.id ? "승인 중…" : "방문 승인"}</Button>
                <Button variant="ghost" disabled={!!desk.approving} onClick={() => { setSelected(null); setConfirmed(false); }}>취소</Button>
              </div>
            </div> : <Button variant="secondary" className="mt-4 w-full" disabled={!!desk.approving} onClick={() => { setSelected(`${item.id}:${item.created_at}`); setConfirmed(false); }}>이 손님 확인</Button>}
          </li>)}</ul>}
        <p className="mt-4 text-xs leading-5 text-slate-500">화면이 열려 있을 때 약 5초마다 확인해요. 방문 승인으로 결제나 할인 처리가 실행되지는 않아요.</p>
      </section>
    </div>
  </div>;
}
