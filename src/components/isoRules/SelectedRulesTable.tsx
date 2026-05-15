

export default function SelectedRulesTable({ selectedRules, onRemove }: any) {
  return (
    <div className="overflow-hidden rounded-xl border border-app-border">
      <table className="w-full text-sm">
        <thead className="bg-app-surface">
          <tr className="border-b border-app-border text-left">
            <th className="px-4 py-3 font-semibold app-text-muted">Código ISO</th>
            <th className="px-4 py-3 font-semibold app-text-muted">Descripción</th>
            <th className="w-20 px-4 py-3 font-semibold app-text-muted">Acción</th>
          </tr>
        </thead>
        <tbody>
          {selectedRules.map((rule: any) => (
            <tr key={rule.id} className="border-b border-app-border last:border-b-0 bg-app-card">
              <td className="px-4 py-3 font-semibold app-text-primary">{rule.code}</td>
              <td className="px-4 py-3 app-text-secondary">{rule.description}</td>
              <td className="px-4 py-3 text-center">
                <button onClick={() => onRemove(rule.id)} className="inline-flex items-center justify-center rounded-lg px-2 py-1 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20" title="Eliminar">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
