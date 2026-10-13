"use client";

import { useEffect, useState } from "react";
import { MEMBER_EVENTS } from "@/lib/events";
import type { MemberDto } from "@/lib/members-api";
import { AddMemberDrawer } from "./AddMemberDrawer";

type DrawerState = {
  open: boolean;
  member: MemberDto | null;
};

/**
 * Global host for the member drawer. Listens for the create/edit events so the
 * quick-action buttons in the shell can open it from anywhere.
 */
export function AddMemberEventHandler() {
  const [state, setState] = useState<DrawerState>({ open: false, member: null });

  useEffect(() => {
    const onOpenCreate = () => setState({ open: true, member: null });
    const onOpenEdit = (event: Event) => {
      const detail = (event as CustomEvent<{ member?: MemberDto }>).detail;
      if (detail?.member) setState({ open: true, member: detail.member });
    };

    window.addEventListener(MEMBER_EVENTS.openCreate, onOpenCreate);
    window.addEventListener(MEMBER_EVENTS.openEdit, onOpenEdit);
    return () => {
      window.removeEventListener(MEMBER_EVENTS.openCreate, onOpenCreate);
      window.removeEventListener(MEMBER_EVENTS.openEdit, onOpenEdit);
    };
  }, []);

  return (
    <AddMemberDrawer
      open={state.open}
      member={state.member}
      onOpenChange={(open) => setState((current) => ({ ...current, open }))}
    />
  );
}
