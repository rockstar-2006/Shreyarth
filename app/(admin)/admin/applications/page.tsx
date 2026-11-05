'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  listApplications, 
  updateApplicationStatus, 
  importApplicationToStudentDatabase 
} from '@/lib/firebase/firestore/applications';
import { ScholarshipApplication, ApplicationStatus } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import {
  FileText,
  Search,
  Download,
  Settings,
  UserCheck,
  CheckCircle,
  Eye,
  ExternalLink,
  Phone,
  Mail,
  GraduationCap,
  HeartHandshake,
  Coins,
  ShieldCheck,
  FolderOpen,
  X
} from 'lucide-react';

export default function ApplicationsManagementPage() {
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [casteFilter, setCasteFilter] = useState<string>('all');
  const [parentFilter, setParentFilter] = useState<string>('all');
  const [maxIncomeFilter, setMaxIncomeFilter] = useState<string>('all');

  // Modal Dossier
  const [selectedApp, setSelectedApp] = useState<ScholarshipApplication | null>(null);
  const [isImporting, setIsImporting] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await listApplications();
      setApplications(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load student applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Unique castes from loaded applications for filter
  const uniqueCastes = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((a) => {
      if (a.caste) set.add(a.caste);
    });
    return Array.from(set).sort();
  }, [applications]);

  // Filtered List
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      // Search
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !search ||
        app.studentName.toLowerCase().includes(search) ||
        app.usn.toLowerCase().includes(search) ||
        app.applicationNumber.toLowerCase().includes(search) ||
        app.department.toLowerCase().includes(search) ||
        app.caste.toLowerCase().includes(search);

      // Status
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

      // Caste
      const matchesCaste = casteFilter === 'all' || app.caste === casteFilter;

      // Parental status
      const matchesParent = parentFilter === 'all' || app.parentStatus === parentFilter;

      // Max Income
      let matchesIncome = true;
      if (maxIncomeFilter === '100000') {
        matchesIncome = (app.annualIncome || 0) <= 100000;
      } else if (maxIncomeFilter === '250000') {
        matchesIncome = (app.annualIncome || 0) <= 250000;
      }

      return matchesSearch && matchesStatus && matchesCaste && matchesParent && matchesIncome;
    });
  }, [applications, searchTerm, statusFilter, casteFilter, parentFilter, maxIncomeFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((a) => a.status === 'pending').length;
    const verified = applications.filter((a) => a.status === 'verified').length;
    const imported = applications.filter((a) => a.importedToStudentDb).length;
    const singleParent = applications.filter((a) => a.parentStatus === 'single_mother' || a.parentStatus === 'single_father' || a.parentStatus === 'orphan').length;
    return { total, pending, verified, imported, singleParent };
  }, [applications]);

  // 1-Click Import
  const handleImport = async (app: ScholarshipApplication) => {
    if (app.importedToStudentDb) {
      toast('Student is already imported to the Student Database');
      return;
    }
    setIsImporting(app.id || '');
    try {
      await importApplicationToStudentDatabase(app);
      toast.success(`${app.studentName} imported to Student Database!`);
      // Update local state
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: 'imported', importedToStudentDb: true } : a))
      );
      if (selectedApp?.id === app.id) {
        setSelectedApp((prev) => prev ? { ...prev, status: 'imported', importedToStudentDb: true } : null);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to import student');
    } finally {
      setIsImporting(null);
    }
  };

  // Status Change
  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      await updateApplicationStatus(appId, newStatus);
      toast.success(`Application marked as ${newStatus}`);
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
      if (selectedApp?.id === appId) {
        setSelectedApp((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  // CSV Export
  const exportToCSV = () => {
    if (filteredApps.length === 0) {
      toast.error('No applications to export');
      return;
    }
    const headers = [
      'Ref ID',
      'Name',
      'USN',
      'Branch',
      'Semester',
      'CGPA',
      'Caste',
      'Family Care Status',
      'Father Occupation',
      'Mother Occupation',
      'Annual Income (Rs)',
      'SSLC %',
      'PUC %',
      'Backlogs',
      'Prior Scholarship',
      'Mobile',
      'Email',
      'Documents Drive Link',
      'Status',
      'Personal Statement',
    ];

    const rows = filteredApps.map((a) => [
      `"${a.applicationNumber}"`,
      `"${a.studentName}"`,
      `"${a.usn}"`,
      `"${a.department}"`,
      `"${a.semester}"`,
      a.cgpa,
      `"${a.caste}"`,
      `"${a.parentStatus}"`,
      `"${a.fatherOccupation || ''}"`,
      `"${a.motherOccupation || ''}"`,
      a.annualIncome,
      a.sslcPercentage,
      a.pucPercentage,
      `"${a.backlogStatus}"`,
      `"${a.prevScholarshipReceived ? a.prevScholarshipDetails : 'No'}"`,
      `"${a.studentPhone}"`,
      `"${a.email}"`,
      `"${a.documentsDriveLink || ''}"`,
      `"${a.status}"`,
      `"${(a.statementOfNeed || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SHREYARTH_SMVITM_Scholarship_Applications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Applications exported to CSV successfully');
  };

  return (
    <div className="space-y-6">

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-2xl text-[#7B1436]">
              SHREYARTH — Student Applications (SMVITM)
            </h1>
            <Badge variant="default">{applications.length}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review self-registered applicants, filter by living structure, and 1-click import into the Student Database.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/apply"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E2D9CE] hover:bg-[#FAF8F5] text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <ExternalLink size={14} className="text-[#C59048]" />
            <span>Open Public Form</span>
          </Link>

          <Link
            href="/admin/applications/settings"
            className="px-3.5 py-2 rounded-xl bg-[#FDF6E7] border border-[#C59048]/40 hover:bg-[#F5EDD8] text-[#7B1436] text-xs font-bold flex items-center gap-1.5 shadow-2xs"
          >
            <Settings size={14} className="text-[#C59048]" />
            <span>Form Settings & Fields</span>
          </Link>

          <button
            onClick={exportToCSV}
            className="px-4 py-2 rounded-xl bg-[#7B1436] hover:bg-[#63102B] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-[#E2D9CE] shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Submissions</span>
          <span className="font-heading font-black text-2xl text-slate-800 mt-1 block">
            {metrics.total}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase block">Pending Review</span>
          <span className="font-heading font-black text-2xl text-amber-700 mt-1 block">
            {metrics.pending}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-800 uppercase block">Verified</span>
          <span className="font-heading font-black text-2xl text-blue-700 mt-1 block">
            {metrics.verified}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase block">In Student DB</span>
          <span className="font-heading font-black text-2xl text-emerald-700 mt-1 block">
            {metrics.imported}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-[#FAF0F3] border border-[#7B1436]/20 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-[#7B1436] uppercase block">Single Parent / Guardian Care</span>
          <span className="font-heading font-black text-2xl text-[#7B1436] mt-1 block">
            {metrics.singleParent}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card accent>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative sm:col-span-2">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Name, USN, Ref ID, Caste..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436]"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#7B1436]"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="imported">Imported to DB</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Caste Filter */}
            <div>
              <select
                value={casteFilter}
                onChange={(e) => setCasteFilter(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#7B1436]"
              >
                <option value="all">All Castes ({uniqueCastes.length})</option>
                {uniqueCastes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Parent Status Filter */}
            <div>
              <select
                value={parentFilter}
                onChange={(e) => setParentFilter(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#7B1436]"
              >
                <option value="all">All Family Care Structures</option>
                <option value="single_mother">Single Parent (Mother)</option>
                <option value="single_father">Single Parent (Father)</option>
                <option value="orphan">Guardian / Relative Care</option>
                <option value="both_alive">Both Parents</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Applications Table */}
      <Card accent>
        <CardHeader className="bg-[#FAF8F5] border-b border-[#E2D9CE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-sm text-[#7B1436]">
              Registered Candidates
            </h2>
            <Badge variant="default">{filteredApps.length}</Badge>
          </div>
          <span className="text-2xs text-slate-500">
            Showing {filteredApps.length} of {applications.length} total applications
          </span>
        </CardHeader>

        <CardBody className="p-0">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={6} />
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <FileText size={40} className="text-slate-300 mx-auto" />
              <p className="font-heading font-semibold text-slate-700 text-sm">
                No scholarship applications match the filter.
              </p>
              <p className="text-2xs text-slate-400">
                Share the public form link <code className="bg-slate-100 px-1 py-0.5 rounded text-[#7B1436]">/apply</code> with students to start collecting submissions.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#E2D9CE] text-[#8A7E82] uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4 w-12 text-center">Sl</th>
                    <th className="py-3 px-4 min-w-[140px]">Ref & Candidate</th>
                    <th className="py-3 px-4 min-w-[130px]">Branch / Sem</th>
                    <th className="py-3 px-4 min-w-[120px]">Caste / Category</th>
                    <th className="py-3 px-4 min-w-[140px]">Family & Income</th>
                    <th className="py-3 px-4 min-w-[90px]">CGPA / %</th>
                    <th className="py-3 px-4 text-center min-w-[100px]">Status</th>
                    <th className="py-3 px-4 text-center min-w-[140px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3D9]">
                  {filteredApps.map((app, idx) => {
                    const isSingleParent =
                      app.parentStatus === 'single_mother' ||
                      app.parentStatus === 'single_father' ||
                      app.parentStatus === 'orphan';

                    return (
                      <tr key={app.id} className="hover:bg-[#FFFDF9] transition-colors">
                        <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700">
                          {idx + 1}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 text-sm block">
                              {app.studentName}
                            </span>
                            <div className="flex items-center gap-1.5 font-mono text-2xs text-slate-500">
                              <span className="font-semibold text-[#7B1436]">{app.usn}</span>
                              <span>•</span>
                              <span>{app.applicationNumber}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-medium text-slate-800 block text-[11px]">
                              {app.department.split('(')[1]?.replace(')', '') || app.department}
                            </span>
                            <span className="text-2xs text-slate-500 block">{app.semester}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-[#FDF6E7] border border-[#C59048]/30 text-[#7B1436] font-semibold text-[11px] inline-block">
                            {app.caste}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className="font-mono font-bold text-emerald-700 text-xs block">
                              ₹{Number(app.annualIncome).toLocaleString('en-IN')}/yr
                            </span>
                            {isSingleParent ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                                {app.parentStatus === 'single_mother' ? 'Single Parent (Mother)' :
                                 app.parentStatus === 'single_father' ? 'Single Parent (Father)' : 'Guardian Care'}
                              </span>
                            ) : (
                              <span className="text-2xs text-slate-500">Both Parents</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-slate-800 block">
                              {app.cgpa > 0 ? `CGPA: ${app.cgpa}` : '—'}
                            </span>
                            <span className="text-2xs text-slate-500 block">
                              PUC: {app.pucPercentage}%
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {app.importedToStudentDb ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 inline-flex items-center gap-1">
                              <CheckCircle size={10} /> In Database
                            </span>
                          ) : app.status === 'verified' ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-300">
                              Verified
                            </span>
                          ) : app.status === 'rejected' ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold border border-red-300">
                              Rejected
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                              Pending
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View Full Dossier */}
                            <button
                              onClick={() => setSelectedApp(app)}
                              title="View Full Application Dossier"
                              className="p-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-[#FAF8F5] hover:text-[#7B1436] transition-colors"
                            >
                              <Eye size={14} />
                            </button>

                            {/* View Google Drive Soft Copies */}
                            {app.documentsDriveLink && (
                              <a
                                href={app.documentsDriveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open Original Documents (Google Drive)"
                                className="p-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <FolderOpen size={14} />
                              </a>
                            )}

                            {/* 1-Click Import into Student Records */}
                            <button
                              onClick={() => handleImport(app)}
                              disabled={app.importedToStudentDb || isImporting === app.id}
                              title={app.importedToStudentDb ? 'Already in Student Database' : '1-Click Import to Student Database'}
                              className="px-2.5 py-1 rounded-lg bg-[#7B1436] hover:bg-[#63102B] disabled:opacity-40 text-white font-semibold text-[11px] flex items-center gap-1 shadow-2xs transition-all"
                            >
                              {isImporting === app.id ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <UserCheck size={12} />
                              )}
                              <span>{app.importedToStudentDb ? 'Imported' : 'Import'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ─── MODAL: FULL CANDIDATE DOSSIER ─── */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#C59048]/40 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-[#7B1436] to-[#5C0F28] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                  {selectedApp.studentName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-sm sm:text-base leading-tight truncate">
                    {selectedApp.studentName}
                  </h3>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-white/80 text-[11px] sm:text-xs font-mono flex-wrap">
                    <span>{selectedApp.usn}</span>
                    <span>•</span>
                    <span>Ref: {selectedApp.applicationNumber}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 text-xs text-slate-700">

              {/* Status & Quick Tags */}
              <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CE]">
                <div className="flex items-center gap-2">
                  <span className="text-2xs font-bold uppercase text-slate-500">Current Status:</span>
                  <span className="font-bold text-slate-900 uppercase">{selectedApp.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedApp.importedToStudentDb && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      ✓ Imported to Student Database
                    </span>
                  )}
                </div>
              </div>

              {/* Academic Grid */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <GraduationCap size={15} className="text-[#7B1436]" />
                  Academic Profile
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div><span className="text-slate-500 block">Department:</span> <strong>{selectedApp.department}</strong></div>
                  <div><span className="text-slate-500 block">Semester:</span> <strong>{selectedApp.semester}</strong></div>
                  <div><span className="text-slate-500 block">Current CGPA:</span> <strong>{selectedApp.cgpa}</strong></div>
                  <div><span className="text-slate-500 block">Backlog Status:</span> <strong>{selectedApp.backlogStatus}</strong></div>
                  <div><span className="text-slate-500 block">10th / SSLC:</span> <strong>{selectedApp.sslcPercentage}%</strong></div>
                  <div><span className="text-slate-500 block">12th / PUC:</span> <strong>{selectedApp.pucPercentage}%</strong></div>
                </div>
              </div>

              {/* Social & Family */}
              <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <HeartHandshake size={15} className="text-[#C59048]" />
                  Community Category &amp; Family Care Structure
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div><span className="text-slate-500 block">Caste / Community:</span> <strong className="text-[#7B1436] font-bold">{selectedApp.caste}</strong></div>
                  <div><span className="text-slate-500 block">Family Structure:</span> <strong>
                    {selectedApp.parentStatus === 'single_mother' ? 'Single Parent (Mother)' :
                     selectedApp.parentStatus === 'single_father' ? 'Single Parent (Father)' :
                     selectedApp.parentStatus === 'orphan' ? 'Guardian / Relative Care' : 'Both Parents'}
                  </strong></div>
                  <div><span className="text-slate-500 block">Annual Income:</span> <strong className="text-emerald-700 font-mono font-bold">₹{Number(selectedApp.annualIncome).toLocaleString('en-IN')}</strong></div>
                  <div><span className="text-slate-500 block">Father&apos;s Occupation:</span> <strong>{selectedApp.fatherOccupation}</strong></div>
                  <div><span className="text-slate-500 block">Mother&apos;s Occupation:</span> <strong>{selectedApp.motherOccupation}</strong></div>
                  <div><span className="text-slate-500 block">Siblings:</span> <strong>{selectedApp.siblingsTotal} ({selectedApp.siblingsStudying} studying)</strong></div>
                </div>
              </div>

              {/* Supporting Documents (Google Drive) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                    <FolderOpen size={16} className="text-blue-700" />
                    <span>Original Supporting Documents (Google Drive Soft Copies)</span>
                  </div>
                  {selectedApp.documentsDriveLink ? (
                    <a
                      href={selectedApp.documentsDriveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <ExternalLink size={13} />
                      <span>Open Drive Folder</span>
                    </a>
                  ) : (
                    <span className="text-2xs text-slate-400 italic">No Drive link provided</span>
                  )}
                </div>
                {selectedApp.documentsDriveLink && (
                  <p className="text-2xs font-mono text-blue-800 break-all bg-white/80 p-2 rounded-lg border border-blue-200">
                    {selectedApp.documentsDriveLink}
                  </p>
                )}
              </div>

              {/* Prior Financial Aid */}
              <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200 space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Coins size={15} className="text-blue-700" />
                  Prior Financial Aid
                </h4>
                <p className="text-[11px] text-slate-700">
                  {selectedApp.prevScholarshipReceived ? (
                    <>
                      Received: <strong>{selectedApp.prevScholarshipDetails}</strong> (Amount: ₹{selectedApp.prevScholarshipAmount || 0})
                    </>
                  ) : (
                    'No prior scholarships received in previous academic year.'
                  )}
                </p>
              </div>

              {/* Statement of Need */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs">Statement of Financial Need (Student&apos;s Own Words):</h4>
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CE] text-slate-800 text-xs leading-relaxed italic">
                  &ldquo;{selectedApp.statementOfNeed}&rdquo;
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <Phone size={13} className="text-[#7B1436]" />
                  <span>Student WhatsApp: <strong>{selectedApp.studentPhone}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone size={13} className="text-[#C59048]" />
                  <span>Parent Phone: <strong>{selectedApp.parentPhone}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 sm:col-span-2">
                  <Mail size={13} className="text-[#7B1436]" />
                  <span>Email: <strong>{selectedApp.email}</strong></span>
                </div>
                {selectedApp.talukDistrict && (
                  <div className="sm:col-span-2 text-slate-600">
                    Location: {selectedApp.talukDistrict} ({selectedApp.address})
                  </div>
                )}
              </div>

              {/* Custom Admin Questions Answers */}
              {selectedApp.customFields && Object.keys(selectedApp.customFields).length > 0 && (
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs">Custom Institutional Question Responses</h4>
                  <div className="space-y-1 text-[11px]">
                    {Object.entries(selectedApp.customFields).map(([k, v]) => (
                      <div key={k} className="flex items-start gap-2">
                        <span className="font-semibold text-slate-700">{k}:</span>
                        <span className="text-slate-900">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-[#E2D9CE] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedApp.id!, 'verified')}
                  className="px-3 py-1.5 rounded-lg border border-blue-400 text-blue-700 hover:bg-blue-50 font-semibold text-xs"
                >
                  Mark Verified
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedApp.id!, 'rejected')}
                  className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-semibold text-xs"
                >
                  Reject
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Close
                </button>

                <button
                  type="button"
                  disabled={selectedApp.importedToStudentDb || isImporting === selectedApp.id}
                  onClick={() => handleImport(selectedApp)}
                  className="px-5 py-2 rounded-xl bg-[#7B1436] hover:bg-[#63102B] disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <UserCheck size={14} />
                  <span>{selectedApp.importedToStudentDb ? 'Already in Database' : 'Import to Student Database'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
