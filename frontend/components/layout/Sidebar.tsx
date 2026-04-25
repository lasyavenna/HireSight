import Link from 'next/link'

const communities = [
  { name: 'SWEJobs', members: 12400 },
  { name: 'ProductManagement', members: 8200 },
  { name: 'DataScience', members: 9100 },
  { name: 'Recruiting', members: 3400 },
  { name: 'FirstJobHunt', members: 15600 },
]

export default function Sidebar() {
  return (
    <aside className="w-72 flex-shrink-0 hidden lg:block space-y-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h3 className="font-semibold text-sm text-zinc-400 uppercase tracking-wide mb-3">Top Communities</h3>
        <ul className="space-y-2">
          {communities.map((c) => (
            <li key={c.name}>
              <Link href={`/c/${c.name}`} className="flex justify-between items-center hover:text-violet-400 transition-colors text-sm">
                <span>c/{c.name}</span>
                <span className="text-zinc-500 text-xs">{(c.members / 1000).toFixed(1)}k</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-gradient-to-br from-violet-900/40 to-zinc-900 border border-violet-800/40 rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-2">Ghost Job Detector</h3>
        <p className="text-xs text-zinc-400 mb-3">Paste any job posting and find out if it's real before you spend 3 hours applying.</p>
        <Link href="/ghost-detector" className="block text-center bg-violet-600 hover:bg-violet-500 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
          Analyze a Job →
        </Link>
      </div>
    </aside>
  )
}