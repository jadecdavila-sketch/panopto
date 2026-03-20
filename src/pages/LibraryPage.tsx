import { TopicsSection } from '../components/library/TopicsSection'
import { AssetsTable } from '../components/library/AssetsTable'

export default function LibraryPage() {
  return (
    <div className="space-y-10 p-6">
      <h1 className="text-2xl font-semibold text-text-primary">Library</h1>

      <TopicsSection />

      <AssetsTable />
    </div>
  )
}
