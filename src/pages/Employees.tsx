import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Briefcase, Banknote, X, Save, Edit2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Employee } from '../types';
import { DataService } from '../services/dataService';
import ConfirmModal from '../components/ConfirmModal';

const employeeSchema = z.object({
  name: z.string().min(1, "Nama harus diisi"),
  position: z.string().min(1, "Jabatan harus diisi"),
  salary: z.number().min(0, "Gaji tidak boleh negatif"),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

export default function Employees() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [empToDelete, setEmpToDelete] = useState<number | null>(null);

  // Live query for employees
  const employees = useLiveQuery(() => DataService.getEmployees()) || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
  });

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
      await DataService.saveEmployee({ ...data, id: editingEmployee?.id });
      setIsModalOpen(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const handleDelete = (id: number) => {
    setEmpToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (empToDelete === null) return;
    try {
      await DataService.deleteEmployee(empToDelete);
    } catch (error) {
      console.error('Error deleting employee:', error);
    } finally {
      setEmpToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const totalMonthlySalary = employees.reduce((sum, emp) => sum + emp.salary, 0);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-montserrat font-bold text-slate-900">Manajemen SDM</h2>
          <p className="text-slate-500 font-medium mt-1">Kelola data karyawan dan struktur gaji operasional.</p>
        </div>
        <button
          onClick={() => {
            setEditingEmployee(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary shadow-emerald-200"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Karyawan</span>
        </button>
      </div>

      {/* Stats Dashboard */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="card-premium flex items-center gap-6 group hover:border-emerald-200 transition-all">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
            <Banknote size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Beban Gaji</p>
            <p className="text-2xl font-black text-slate-900">
              Rp {totalMonthlySalary.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
        
        <div className="card-premium flex items-center gap-6 group hover:border-emerald-200 transition-all">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
            <Users size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Staff</p>
            <p className="text-2xl font-black text-slate-900">{employees.length} Orang</p>
          </div>
        </div>

        <div className="card-premium bg-slate-900 border-none group">
           <div className="flex flex-col h-full justify-center">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Rata-rata Gaji</p>
             <p className="text-xl font-black text-white">
               Rp {(employees.length > 0 ? totalMonthlySalary / employees.length : 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
             </p>
           </div>
        </div>
      </motion.div>

      <div className="card-premium !p-0 overflow-hidden shadow-2xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Karyawan</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Jabatan / Role</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Gaji Bulanan</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Users size={32} className="text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Belum ada data staff</p>
                  </td>
                </tr>
              ) : (
                employees.map((employee, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={employee.id} 
                    className="hover:bg-slate-50/50 transition-all group"
                  >
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="font-black text-slate-800 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{employee.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">ID: EM-{employee.id.toString().padStart(3, '0')}</div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                        <Briefcase size={12} />
                        {employee.position}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-lg font-black text-slate-900 group-hover:scale-105 transition-transform origin-left">
                        Rp {employee.salary.toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right">
                       <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              setEditingEmployee(employee);
                              setIsModalOpen(true);
                            }}
                            className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Edit Data Karyawan"
                            aria-label="Edit Data Karyawan"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(employee.id);
                            }}
                            className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            title="Hapus Data Karyawan"
                            aria-label="Hapus Data Karyawan"
                          >
                            <Trash2 size={18} />
                          </button>
                       </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-modal max-w-md w-full p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingEmployee ? 'Update Data Staff' : 'Registrasi Karyawan'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  title="Tutup Modal"
                  aria-label="Tutup Modal"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="label-premium">Nama Lengkap</label>
                  <input
                    {...register('name')}
                    className="input-premium py-4"
                    placeholder="Contoh: Budi Santoso"
                    autoFocus
                  />
                  {errors.name && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 ml-1">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="label-premium">Jabatan / Role</label>
                  <input
                    {...register('position')}
                    className="input-premium py-4"
                    placeholder="Contoh: Head Chef, Barista, Server"
                  />
                  {errors.position && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 ml-1">{errors.position.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="label-premium">Gaji Bulanan (Rp)</label>
                  <input
                    type="number"
                    {...register('salary', { valueAsNumber: true })}
                    className="input-premium py-4 text-xl font-bold text-emerald-600"
                    placeholder="0"
                  />
                  {errors.salary && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 ml-1">{errors.salary.message}</p>}
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    className="btn btn-primary flex-1 py-4 shadow-none"
                  >
                    <Save size={20} />
                    <span>{editingEmployee ? 'Update Data' : 'Simpan Karyawan'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-secondary px-8"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Data Karyawan"
        message="Anda akan menghapus data karyawan ini secara permanen dari sistem penggajian. Lanjutkan?"
      />
    </div>
  );
}
