import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Users, Briefcase, Banknote } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import clsx from 'clsx';

const employeeSchema = z.object({
  name: z.string().min(1, "Nama harus diisi"),
  position: z.string().min(1, "Jabatan harus diisi"),
  salary: z.number().min(0, "Gaji tidak boleh negatif"),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

interface Employee {
  id: number;
  name: string;
  position: string;
  salary: number;
  created_at: string;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
  });

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (editingEmployee) {
      reset({
        name: editingEmployee.name,
        position: editingEmployee.position,
        salary: editingEmployee.salary,
      });
    } else {
      reset({ name: '', position: '', salary: 0 });
    }
  }, [editingEmployee, reset]);

  const onSubmit = async (data: EmployeeForm) => {
    try {
      const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : '/api/employees';
      const method = editingEmployee ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setEditingEmployee(null);
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus karyawan ini?')) return;
    
    try {
      const response = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const totalMonthlySalary = employees.reduce((sum, emp) => sum + emp.salary, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Karyawan</h2>
          <p className="text-gray-500">Kelola data staf dan gaji bulanan</p>
        </div>
        <button
          onClick={() => {
            setEditingEmployee(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Tambah Karyawan
        </button>
      </div>

      {/* Stats Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-6">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
          <Banknote className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Total Beban Gaji Bulanan</p>
          <p className="text-2xl font-bold text-gray-900">
            Rp {totalMonthlySalary.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-gray-500">
          <Users className="w-5 h-5" />
          <span className="font-medium">{employees.length} Karyawan</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Karyawan</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Jabatan</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gaji Bulanan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">Memuat data...</td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">Belum ada data karyawan.</td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => {
                  setEditingEmployee(employee);
                  setIsModalOpen(true);
                }}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{employee.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      <Briefcase className="w-3 h-3" />
                      {employee.position}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">
                      Rp {employee.salary.toLocaleString('id-ID')}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
              </h3>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  {...register('name')}
                  className={clsx(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all",
                    errors.name ? "border-red-500" : "border-gray-300"
                  )}
                  placeholder="Contoh: Budi Santoso"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
                <input
                  {...register('position')}
                  className={clsx(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all",
                    errors.position ? "border-red-500" : "border-gray-300"
                  )}
                  placeholder="Contoh: Chef, Waiter, Kasir"
                />
                {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gaji Bulanan (Rp)</label>
                <input
                  type="number"
                  {...register('salary', { valueAsNumber: true })}
                  className={clsx(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all",
                    errors.salary ? "border-red-500" : "border-gray-300"
                  )}
                  placeholder="0"
                />
                {errors.salary && <p className="text-red-500 text-xs mt-1">{errors.salary.message}</p>}
              </div>

              <div className="flex gap-3 pt-4">
                {editingEmployee && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingEmployee.id)}
                    className="btn btn-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus
                  </button>
                )}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
