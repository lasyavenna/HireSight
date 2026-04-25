import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 max-w-6xl mx-auto w-full px-4 py-6 gap-6">
        <main className="flex-1 min-w-0">{children}</main>
        <Sidebar />
      </div>
    </div>
  )
}