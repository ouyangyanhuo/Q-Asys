export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // relative：背景纸场是 fixed z-0，案头要压在它上面
  return <div className="relative min-h-dvh bg-kraft">{children}</div>;
}
