import { useSidebar } from '@/components/ui/sidebar';
import { useEffect } from 'react';

export function SidebarContextSetter() {
  const { setOpen, setOpenMobile } = useSidebar();
  useEffect(() => {
    (window as any).sidebarCtx = { setOpen, setOpenMobile };
    return () => {
      (window as any).sidebarCtx = undefined;
    };
  }, [setOpen, setOpenMobile]);
  return null;
}
