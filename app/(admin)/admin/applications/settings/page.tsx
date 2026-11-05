'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  getFormConfig, 
  updateFormConfig, 
  DEFAULT_CASTES,
  DEFAULT_FORM_FIELDS 
} from '@/lib/firebase/firestore/applications';
import { 
  ApplicationFormConfig, 
  FormFieldConfig, 
  CustomFieldType,
  FieldSection 
} from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  Eye,
  EyeOff,
  Settings2,
  FileText,
  HelpCircle,
  FolderOpen,
  User,
  HeartHandshake,
  Coins,
  Phone,
  Layers,
  X,
  Sparkles,
  Copy,
  RotateCcw
} from 'lucide-react';

const SECTION_HEADERS: { key: FieldSection; title: string; desc: string; icon: any }[] = [
  { key: 'academic', title: '1. Academic & Student Identification', desc: 'Name, USN, branch, semester, CGPA, and marks', icon: User },
  { key: 'family', title: '2. Community Category & Family Structure', desc: 'Caste, living structure, occupations, income, siblings', icon: HeartHandshake },
  { key: 'aid', title: '3. Prior Financial Aid & Personal Statement', desc: 'Past scholarships and personal statement of need', icon: Coins },
  { key: 'contact', title: '4. Contact & Residential Details', desc: 'Mobile numbers, email, and address info', icon: Phone },
  { key: 'documents', title: '5. Supporting Documents (Google Drive Link)', desc: 'Soft copies of original certificates and marks cards', icon: FolderOpen },
  { key: 'custom', title: '6. Additional Institutional Questions', desc: 'Custom questions configured by the SWB administration', icon: HelpCircle },
];

export default function ApplicationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'settings' | 'castes'>('questions');

  // Form Config State
  const [isOpen, setIsOpen] = useState(true);
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [title, setTitle] = useState('scholarship-smv — SMVITM Scholarship Application Form');
  const [description, setDescription] = useState('');
  const [closedMessage, setClosedMessage] = useState('');
  const [allowedCastes, setAllowedCastes] = useState<string[]>(DEFAULT_CASTES);
  
  // All Form Questions (Google Forms Style)
  const [fields, setFields] = useState<FormFieldConfig[]>(DEFAULT_FORM_FIELDS);

  // New Caste input
  const [newCasteInput, setNewCasteInput] = useState('');

  // Add Question Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [insertAfterFieldId, setInsertAfterFieldId] = useState<string | null>(null);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldSection, setNewFieldSection] = useState<FieldSection>('custom');
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldHelp, setNewFieldHelp] = useState('');
  const [newFieldOptionsText, setNewFieldOptionsText] = useState('');

  // New Option input for existing fields
  const [newOptionInput, setNewOptionInput] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const cfg = await getFormConfig();
        setIsOpen(cfg.isOpen);
        setAcademicYear(cfg.academicYear);
        setTitle(cfg.title || 'scholarship-smv — SMVITM Scholarship Application Form');
        setDescription(cfg.description);
        setClosedMessage(cfg.closedMessage);
        setAllowedCastes(cfg.allowedCastes);
        if (cfg.fields && cfg.fields.length > 0) {
          setFields(cfg.fields);
        } else {
          setFields(DEFAULT_FORM_FIELDS);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load form settings');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateFormConfig({
        isOpen,
        academicYear,
        title,
        description,
        closedMessage,
        allowedCastes,
        fields,
      });
      toast.success('Google Form configuration & questions saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Field Enabled / Disabled (Visibility)
  const toggleFieldVisibility = (fieldId: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, enabled: !f.enabled } : f))
    );
  };

  // Toggle Field Required / Optional
  const toggleFieldRequired = (fieldId: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, required: !f.required } : f))
    );
  };

  // Update Field Label
  const updateFieldLabel = (fieldId: string, label: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, label } : f))
    );
  };

  // Change Field Type
  const handleFieldTypeChange = (fieldId: string, newType: CustomFieldType) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId) return f;
        let opts = f.options;
        if (newType === 'select' && (!opts || opts.length === 0)) {
          opts = ['Option 1', 'Option 2'];
        }
        return { ...f, type: newType, options: opts };
      })
    );
  };

  // Add Option to a field (e.g. Department, Backlog, or Custom select)
  const handleAddOptionToField = (fieldId: string) => {
    const text = (newOptionInput[fieldId] || '').trim();
    if (!text) return;

    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId) return f;
        const currentOpts = f.options || [];
        if (currentOpts.includes(text)) {
          toast.error('Option already exists');
          return f;
        }
        return {
          ...f,
          options: [...currentOpts, text],
        };
      })
    );

    setNewOptionInput((prev) => ({ ...prev, [fieldId]: '' }));
    toast.success(`Option "${text}" added`);
  };

  // Remove Option from a field
  const handleRemoveOptionFromField = (fieldId: string, optionToRemove: string) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId) return f;
        return {
          ...f,
          options: (f.options || []).filter((opt) => opt !== optionToRemove),
        };
      })
    );
  };

  // Delete Question (Now works for ANY field)
  const handleDeleteField = (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
    toast.success('Question deleted from form');
  };

  // Duplicate / Clone Question
  const handleDuplicateField = (fieldId: string) => {
    const index = fields.findIndex((f) => f.id === fieldId);
    if (index === -1) return;
    const original = fields[index];
    const newField: FormFieldConfig = {
      ...original,
      id: `${original.id}_copy_${Date.now().toString(36)}`,
      label: `${original.label} (Copy)`,
      canDelete: true,
      order: original.order + 1,
    };
    const updated = [...fields];
    updated.splice(index + 1, 0, newField);
    setFields(updated);
    toast.success(`Duplicated "${original.label}"`);
  };

  // Open Add Question Modal directly below a specific field
  const handleOpenAddBelow = (fieldId: string, section: FieldSection) => {
    setInsertAfterFieldId(fieldId);
    setNewFieldSection(section);
    setShowAddModal(true);
  };

  // Reset to Default Form Template
  const handleResetDefaults = () => {
    if (window.confirm('Reset all questions to default SMVITM template? Any added custom questions will be replaced.')) {
      setFields(DEFAULT_FORM_FIELDS);
      toast.success('Reset all form questions to default template. Remember to click "Save All Changes" to publish.');
    }
  };

  // Add New Question (Google Forms Modal)
  const handleCreateNewQuestion = () => {
    if (!newFieldLabel.trim()) {
      toast.error('Please enter a question title');
      return;
    }

    const fieldId = 'q_' + Date.now().toString(36);
    const optionsArray = (newFieldType === 'select')
      ? newFieldOptionsText.split(',').map((o) => o.trim()).filter(Boolean)
      : undefined;

    const targetSec = SECTION_HEADERS.find((s) => s.key === newFieldSection);

    const newField: FormFieldConfig = {
      id: fieldId,
      label: newFieldLabel.trim(),
      section: newFieldSection,
      sectionTitle: targetSec?.title || 'Additional Institutional Questions',
      type: newFieldType,
      required: newFieldRequired,
      enabled: true,
      canDelete: true,
      options: optionsArray,
      helpText: newFieldHelp.trim() || undefined,
      order: fields.length + 1,
    };

    if (insertAfterFieldId) {
      const idx = fields.findIndex((f) => f.id === insertAfterFieldId);
      if (idx !== -1) {
        const updated = [...fields];
        updated.splice(idx + 1, 0, newField);
        setFields(updated);
        setInsertAfterFieldId(null);
      } else {
        setFields((prev) => [...prev, newField]);
      }
    } else {
      setFields((prev) => [...prev, newField]);
    }

    setShowAddModal(false);
    setNewFieldLabel('');
    setNewFieldHelp('');
    setNewFieldOptionsText('');
    setNewFieldRequired(false);
    setNewFieldType('text');
    toast.success('New question added to form! Click "Save All Changes" to publish.');
  };

  // Caste Operations
  const handleAddCaste = () => {
    const trimmed = newCasteInput.trim();
    if (!trimmed) return;
    if (allowedCastes.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('This caste is already in the list');
      return;
    }
    setAllowedCastes((prev) => [...prev, trimmed]);
    setNewCasteInput('');
    toast.success(`"${trimmed}" added to caste list`);
  };

  const handleRemoveCaste = (casteToRemove: string) => {
    setAllowedCastes((prev) => prev.filter((c) => c !== casteToRemove));
  };

  // Group fields by section for rendering
  const fieldsBySection = useMemo(() => {
    const map: Record<FieldSection, FormFieldConfig[]> = {
      academic: [],
      family: [],
      aid: [],
      contact: [],
      documents: [],
      custom: [],
    };

    fields.forEach((f) => {
      if (map[f.section]) {
        map[f.section].push(f);
      } else {
        map.custom.push(f);
      }
    });

    return map;
  }, [fields]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-16">

      {/* ── Top Header Navigation Bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#7B1436] mb-1"
          >
            <ArrowLeft size={14} />
            <span>Back to Applications Table</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-2xl text-[#7B1436]">
              scholarship-smv — Scholarship Application Form Editor
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0F3] text-[#7B1436] font-bold text-xs border border-[#7B1436]/20">
              Google Forms Style
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Add questions directly inside any field, delete any field, edit titles, manage choices, and re-order.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetDefaults}
            title="Reset all questions to original SMVITM template"
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1 shadow-2xs"
          >
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </button>

          <Link
            href="/apply"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E2D9CE] hover:bg-[#FAF8F5] text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <ExternalLink size={14} className="text-[#C59048]" />
            <span>Preview Live Form</span>
          </Link>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#7B1436] hover:bg-[#63102B] disabled:opacity-50 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {saving ? (
              <>
                <Spinner />
                <span>Saving Form...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-2 border-b border-[#E2D9CE] pb-1 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'questions'
              ? 'border-[#7B1436] text-[#7B1436] bg-[#FAF8F5]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={15} />
          <span>Form Questions ({fields.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'border-[#7B1436] text-[#7B1436] bg-[#FAF8F5]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings2 size={15} />
          <span>Publication &amp; Banner</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('castes')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'castes'
              ? 'border-[#7B1436] text-[#7B1436] bg-[#FAF8F5]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers size={15} />
          <span>Caste Roster ({allowedCastes.length})</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: FORM QUESTIONS EDITOR (GOOGLE FORMS VIEW)
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'questions' && (
        <div className="space-y-6 animate-fade-in">

          {/* Top Quick Action Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FDF6E7] border border-[#C59048]/40 shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#C59048]" />
              <div>
                <span className="font-heading font-bold text-xs text-[#7B1436] block">
                  Interactive Question Builder (Google Forms Mode)
                </span>
                <span className="text-2xs text-slate-600 block">
                  Delete any field, insert new questions directly below any field, change question types, or add choices.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setInsertAfterFieldId(null);
                setNewFieldSection('custom');
                setShowAddModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#7B1436] hover:bg-[#63102B] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
            >
              <Plus size={15} />
              <span>+ Add Question</span>
            </button>
          </div>

          {/* Sections List */}
          {SECTION_HEADERS.map((section) => {
            const sectionFields = fieldsBySection[section.key] || [];
            if (sectionFields.length === 0 && section.key !== 'custom') return null;

            const SectionIcon = section.icon;

            return (
              <div key={section.key} className="space-y-3">
                {/* Section Header Card */}
                <div className="px-4 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FAF8F5] to-[#F5F0E6] border border-[#E2D9CE] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white text-[#7B1436] flex items-center justify-center shadow-2xs flex-shrink-0">
                      <SectionIcon size={16} />
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-xs text-[#7B1436]">
                        {section.title}
                      </h2>
                      <p className="text-[11px] sm:text-2xs text-slate-500">{section.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Badge variant="default">{sectionFields.length} Questions</Badge>
                    <button
                      type="button"
                      onClick={() => {
                        setInsertAfterFieldId(null);
                        setNewFieldSection(section.key);
                        setShowAddModal(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E2D9CE] hover:bg-[#FAF8F5] text-xs font-bold text-[#7B1436] flex items-center gap-1 shadow-2xs"
                    >
                      <Plus size={12} />
                      <span>Add in Section</span>
                    </button>
                  </div>
                </div>

                {/* Questions within this Section */}
                <div className="space-y-3 pl-0 sm:pl-2">
                  {sectionFields.map((field) => (
                    <div
                      key={field.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        field.enabled
                          ? 'bg-white border-[#E2D9CE] shadow-2xs hover:border-[#C59048]/60'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Top Meta Line: Field ID, Question Type Selector, Status */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-2xs font-bold uppercase text-slate-400">
                              [{field.id}]
                            </span>

                            {/* Direct Type Selector */}
                            <select
                              value={field.type}
                              onChange={(e) => handleFieldTypeChange(field.id, e.target.value as CustomFieldType)}
                              className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-slate-700 focus:ring-1 focus:ring-[#7B1436]"
                              title="Change question type"
                            >
                              <option value="text">Type: Short Text</option>
                              <option value="number">Type: Number</option>
                              <option value="textarea">Type: Paragraph</option>
                              <option value="select">Type: Dropdown Choice</option>
                              <option value="boolean">Type: Yes / No</option>
                              <option value="url">Type: Link / URL</option>
                            </select>

                            {field.required && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                                Required *
                              </span>
                            )}
                            {!field.enabled && (
                              <span className="px-2 py-0.2 rounded bg-slate-200 text-slate-600 text-[10px] font-bold">
                                Hidden on Form
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Inline Editable Question Title */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Question Title / Prompt
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateFieldLabel(field.id, e.target.value)}
                            className="w-full text-xs font-bold text-slate-900 px-3 py-2 rounded-xl border border-slate-200 focus:border-[#7B1436] focus:bg-[#FFFDF9] transition-colors"
                            placeholder="Enter question title..."
                          />
                        </div>

                        {field.helpText && (
                          <p className="text-2xs text-slate-500 italic pl-1">
                            ℹ️ {field.helpText}
                          </p>
                        )}

                        {/* Options Manager (For select / choice fields) */}
                        {field.type === 'select' && (
                          <div className="pt-2 border-t border-slate-100 space-y-2 bg-[#FAF8F5] p-3 rounded-xl border border-slate-200">
                            <span className="text-2xs font-bold text-slate-700 uppercase block">
                              Dropdown Choices / Options ({field.options?.length || 0}):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {field.options?.map((opt) => (
                                <span
                                  key={opt}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-slate-800 text-[11px] font-medium border border-slate-200 shadow-2xs"
                                >
                                  <span>{opt}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOptionFromField(field.id, opt)}
                                    className="text-slate-400 hover:text-rose-600 transition-colors"
                                    title={`Remove "${opt}"`}
                                  >
                                    <X size={12} />
                                  </button>
                                </span>
                              ))}
                            </div>

                            {/* Add Option Input */}
                            <div className="flex items-center gap-2 max-w-sm pt-1">
                              <input
                                type="text"
                                placeholder="Add new choice option..."
                                value={newOptionInput[field.id] || ''}
                                onChange={(e) =>
                                  setNewOptionInput((prev) => ({
                                    ...prev,
                                    [field.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddOptionToField(field.id);
                                  }
                                }}
                                className="text-2xs px-3 py-1.5 rounded-lg border border-slate-300 w-full focus:ring-1 focus:ring-[#7B1436] bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddOptionToField(field.id)}
                                className="px-3 py-1.5 rounded-lg bg-[#7B1436] hover:bg-[#63102B] text-white font-bold text-2xs flex-shrink-0 shadow-2xs"
                              >
                                + Add Choice
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ── CARD BOTTOM ACTIONS TOOLBAR (GOOGLE FORMS STYLE) ── */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 flex-wrap gap-2">
                          {/* Left: Add Question Below & Duplicate */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenAddBelow(field.id, field.section)}
                              className="px-3 py-1.5 rounded-xl bg-[#FAF0F3] hover:bg-[#F5E1E7] text-[#7B1436] font-bold text-2xs flex items-center gap-1.5 border border-[#7B1436]/20 transition-all shadow-2xs"
                              title="Add a question directly inside/below this field"
                            >
                              <Plus size={13} />
                              <span>+ Add Question Below</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDuplicateField(field.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-2xs flex items-center gap-1 transition-all"
                              title="Duplicate this question"
                            >
                              <Copy size={13} />
                              <span>Duplicate</span>
                            </button>
                          </div>

                          {/* Right: Visibility, Required, Delete (ANY field can be deleted!) */}
                          <div className="flex items-center gap-2">
                            {/* Visibility Toggle */}
                            <button
                              type="button"
                              onClick={() => toggleFieldVisibility(field.id)}
                              title={field.enabled ? 'Click to Hide question' : 'Click to Show question'}
                              className={`px-2.5 py-1.5 rounded-xl text-2xs font-bold flex items-center gap-1 transition-colors ${
                                field.enabled
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                              }`}
                            >
                              {field.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                              <span>{field.enabled ? 'Visible' : 'Hidden'}</span>
                            </button>

                            {/* Required Toggle */}
                            <button
                              type="button"
                              onClick={() => toggleFieldRequired(field.id)}
                              title={field.required ? 'Click to make Optional' : 'Click to make Mandatory'}
                              className={`px-2.5 py-1.5 rounded-xl text-2xs font-bold transition-colors ${
                                field.required
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              <span>{field.required ? 'Required *' : 'Optional'}</span>
                            </button>

                            {/* Delete Field Button (Works on ANY field!) */}
                            <button
                              type="button"
                              onClick={() => handleDeleteField(field.id)}
                              title="Delete this question from form"
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: PUBLICATION & GENERAL SETTINGS
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fade-in">
          <Card accent>
            <CardHeader className="bg-[#FAF8F5] border-b border-[#E2D9CE] flex items-center justify-between">
              <h2 className="font-heading font-bold text-sm text-[#7B1436]">
                Form Publication Status
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isOpen
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}>
                {isOpen ? '● Currently Active (Accepting Submissions)' : '○ Form Closed'}
              </span>
            </CardHeader>
            <CardBody className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 text-sm block">
                    Accept Student Submissions at /apply
                  </span>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    When switched on, students can access and submit the form without logging in. When off, students see the closure announcement.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isOpen ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isOpen ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g. 2026-27"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7B1436]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Portal Form Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Form display title"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7B1436]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Form Header Instructions / Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7B1436]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Closed State Notice (Displayed when form is closed)
                  </label>
                  <textarea
                    rows={2}
                    value={closedMessage}
                    onChange={(e) => setClosedMessage(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7B1436]"
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 3: CASTE ROSTER MANAGEMENT
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'castes' && (
        <div className="space-y-6 animate-fade-in">
          <Card accent>
            <CardHeader className="bg-[#FAF8F5] border-b border-[#E2D9CE] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-sm text-[#7B1436]">
                  Caste &amp; Community Options Roster
                </h2>
                <Badge variant="default">{allowedCastes.length}</Badge>
              </div>
              <span className="text-2xs text-slate-500">
                Populates student dropdown. New castes entered via &quot;Other&quot; are automatically saved here.
              </span>
            </CardHeader>
            <CardBody className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter new caste / community name..."
                  value={newCasteInput}
                  onChange={(e) => setNewCasteInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCaste())}
                  className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7B1436]"
                />
                <button
                  type="button"
                  onClick={handleAddCaste}
                  className="px-4 py-2 rounded-xl bg-[#7B1436] hover:bg-[#63102B] text-white text-xs font-bold flex items-center gap-1 shadow-2xs"
                >
                  <Plus size={14} />
                  <span>Add Caste</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {allowedCastes.map((caste) => (
                  <span
                    key={caste}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9CE] text-xs text-slate-800 font-medium hover:border-[#C59048] transition-colors"
                  >
                    <span>{caste}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCaste(caste)}
                      className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5"
                      title={`Remove ${caste}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── MODAL: ADD NEW QUESTION (GOOGLE FORMS STYLE) ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#C59048]/40 shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-slide-up">
            
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-[#7B1436] to-[#5C0F28] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-[#F3DE98]" />
                <h3 className="font-heading font-bold text-sm sm:text-base leading-tight">
                  {insertAfterFieldId ? 'Insert Question Directly Below' : 'Add New Question to Form'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setInsertAfterFieldId(null);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  Question Title / Prompt <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Do you stay in SMVITM College Hostel?"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7B1436]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">
                    Question Section
                  </label>
                  <select
                    value={newFieldSection}
                    onChange={(e) => setNewFieldSection(e.target.value as FieldSection)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#7B1436]"
                  >
                    {SECTION_HEADERS.map((s) => (
                      <option key={s.key} value={s.key}>{s.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">
                    Answer Type
                  </label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as CustomFieldType)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#7B1436]"
                  >
                    <option value="text">Short Answer (Text)</option>
                    <option value="textarea">Paragraph (Textarea)</option>
                    <option value="select">Dropdown Choice</option>
                    <option value="number">Numeric (Number)</option>
                    <option value="boolean">Yes / No Option</option>
                    <option value="url">Link / Document URL</option>
                  </select>
                </div>
              </div>

              {newFieldType === 'select' && (
                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">
                    Choices / Options (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. College Hostel, Day Scholar - College Bus, PG Accommodation"
                    value={newFieldOptionsText}
                    onChange={(e) => setNewFieldOptionsText(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7B1436]"
                  />
                  <p className="text-2xs text-slate-400 mt-1">Separate each choice with a comma</p>
                </div>
              )}

              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  Help Text / Subtitle (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Select whichever option applies for current semester"
                  value={newFieldHelp}
                  onChange={(e) => setNewFieldHelp(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7B1436]"
                />
              </div>

              <div className="pt-2">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="rounded text-[#7B1436] focus:ring-[#7B1436]"
                  />
                  <span>Mark as Mandatory (Required to answer)</span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-[#E2D9CE] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setInsertAfterFieldId(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewQuestion}
                className="px-5 py-2 rounded-xl bg-[#7B1436] hover:bg-[#63102B] text-white text-xs font-bold shadow-xs"
              >
                Insert Question
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Bottom Save Action Bar ── */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2D9CE]">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-7 py-3 rounded-2xl bg-[#7B1436] hover:bg-[#63102B] disabled:opacity-50 text-white font-heading font-bold text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
        >
          {saving ? (
            <>
              <Spinner />
              <span>Saving All Changes...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save &amp; Publish Form</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
