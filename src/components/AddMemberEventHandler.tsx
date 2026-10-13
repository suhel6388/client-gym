"use client";

import { useEffect, useState } from "react";
import { AddMemberDrawer } from "./AddMemberDrawer";

export function AddMemberEventHandler() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-add-member", handler);
    return () => window.removeEventListener("open-add-member", handler);
  }, []);

  return <AddMemberDrawer open={open} onOpenChange={setOpen} />;
}
