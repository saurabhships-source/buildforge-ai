// Builder gets its own layout to escape the dashboard's overflow-hidden wrapper.
// The IDE needs to fill the remaining height below the header with no padding.
export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-full flex flex-col overflow-hidden">{children}</div>
}
