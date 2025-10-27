"use client";

import { CommandPalette, useCommandPalette } from "./";

export function CommandPaletteProvider() {
  const { open, setOpen } = useCommandPalette();

  return <CommandPalette open={open} onOpenChange={setOpen} />;
}
