import type { Branch, Warehouse } from "../domain";

const BRANCH_TYPE_LABELS: Record<Branch["branchType"], string> = {
  store: "Sucursal",
  distribution_center: "CEDIS",
  office: "Oficina",
};

const WAREHOUSE_TYPE_LABELS: Record<Warehouse["warehouseType"], string> = {
  store_backroom: "Almacén de tienda",
  distribution: "Distribución",
};

function StatusBadge({ status }: { status: Branch["status"] }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-green-500" : "bg-gray-400"}`}
      />
      {active ? "Activa" : "Inactiva"}
    </span>
  );
}

export function BranchCard({
  branch,
  warehouses,
}: {
  branch: Branch;
  warehouses: Warehouse[];
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
          <p className="text-sm text-gray-500">
            {branch.code} · {BRANCH_TYPE_LABELS[branch.branchType]}
          </p>
        </div>
        <StatusBadge status={branch.status} />
      </div>

      <div className="mt-4">
        <h4 className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Almacenes
        </h4>
        {warehouses.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">Sin almacenes registrados.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100">
            {warehouses.map((warehouse) => (
              <li key={warehouse.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{warehouse.name}</p>
                  <p className="text-xs text-gray-500">
                    {warehouse.code} · {WAREHOUSE_TYPE_LABELS[warehouse.warehouseType]}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {warehouse.isPrimary && (
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                      Principal
                    </span>
                  )}
                  <StatusBadge status={warehouse.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
