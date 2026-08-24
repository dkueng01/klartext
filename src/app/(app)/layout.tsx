import { MainNav } from "@/components/layout/main-nav";
import { CommandMenu } from "@/components/layout/command-menu";
import { ToastProvider } from "@/components/ui/toast";
import { ConfettiProvider } from "@/components/ui/confetti-provider";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ToastProvider>
      <ConfettiProvider>
        <MainNav />
        <CommandMenu />
        <div className="container mx-auto min-h-[calc(100vh-3.5rem)] max-w-5xl px-4 py-6 pb-24 sm:pb-6">
          {children}
        </div>
      </ConfettiProvider>
    </ToastProvider>
  );
}
