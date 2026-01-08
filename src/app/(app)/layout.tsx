import { MainNav } from "@/components/layout/main-nav";
import { CommandMenu } from "@/components/layout/command-menu";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <MainNav />
      <CommandMenu />
      <div className="container max-w-5xl mx-auto py-6 px-4 min-h-[calc(100vh-3.5rem)]">
        {children}
      </div>
    </>
  );
}