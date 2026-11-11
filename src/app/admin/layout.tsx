import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Links admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="bg-pixel-grid min-h-[100dvh] [--cell:72px]">{children}</div>;
}
