import React from 'react';
import { Plus, X } from 'lucide-react';

const SERVICE_IMG = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80';

const ProviderServices = ({
  listedServices,
  setListedServices,
  isCreateServiceOpen,
  setIsCreateServiceOpen,
  handleCreateServiceSubmit
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Red vertical bar header layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-1.5 h-7 bg-[#DC2626] rounded-full"></div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Listed Services</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Create and publish corporate services to clients.</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateServiceOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>List New Service</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {listedServices.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between group hover:shadow-[0_16px_32px_-8px_rgba(15,42,74,0.08)] transition-all duration-300"
          >
            <div>
              {/* Category banner image overlay */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <img
                  src={SERVICE_IMG}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 leading-tight mb-3">
                  {service.title}
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {service.description}
                </p>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-2">
              <button
                onClick={() => {
                  if (confirm('Delete this service listing?')) {
                    setListedServices(prev => prev.filter(s => s.id !== service.id));
                  }
                }}
                className="w-full py-2.5 rounded-xl border border-red-200 text-[#DC2626] hover:bg-red-50 text-xs font-bold transition-all text-center cursor-pointer"
              >
                Delete Listing
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Publish New Service Modal */}
      {isCreateServiceOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl relative">
            <button onClick={() => setIsCreateServiceOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-bold tracking-widest text-[#DC2626] uppercase">SERVICE LISTING</span>
            <h3 className="text-xl font-black text-slate-900 mt-1 mb-2">Publish New Service</h3>
            <p className="text-xs text-slate-500 mb-6 font-semibold">List a new consultation or strategy package for clients.</p>

            <form onSubmit={handleCreateServiceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. Virtual CFO & FP&A Review"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Description</label>
                <textarea
                  name="description"
                  placeholder="Detail the scope, delivery, and outcome of this consulting package..."
                  rows={3}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>

              <button type="submit" className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#1D1D1F] hover:bg-[#1D1D1F] transition-all shadow-md mt-2 cursor-pointer">
                Publish Service Package
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderServices;
