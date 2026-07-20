import { Navbar } from "@/components/layout/navbar";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex-1 flex flex-col min-h-full">
      <Navbar />
      <div className="flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}
