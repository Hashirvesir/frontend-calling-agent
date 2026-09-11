'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Loader2, ChevronDown, X, Plus, Sparkles, Wand2, FileText } from 'lucide-react';
import { getScriptById, updateScriptApi, suggestExtractionFields, optimizeScript, generateScript } from '@/lib/api';
import type { ExtractionField } from '@/lib/api';
import ScriptReviewDialog from '@/components/dashboard/ScriptReviewDialog';
import GenerateScriptDialog from '@/components/dashboard/GenerateScriptDialog';
import { toast } from 'sonner';

const LANGUAGES = [
  { value: 'ur', label: 'Urdu' },
  { value: 'en', label: 'English' },
];

const PRESETS: Record<string, string[]> = {
  restaurant: ['customer_name', 'phone_number', 'order_items', 'total_amount', 'order_type', 'delivery_address', 'payment_method', 'special_instructions'],
  property:   ['customer_name', 'phone_number', 'city', 'budget', 'property_type', 'property_size', 'visit_date'],
  doctor:     ['patient_name', 'phone_number', 'symptoms', 'appointment_date', 'doctor_preference', 'age'],
  sales:      ['customer_name', 'phone_number', 'product_interest', 'budget', 'delivery_city', 'quantity'],
};

function toName(item: string | ExtractionField): string {
  return typeof item === 'string' ? item : item.name;
}

function toSnake(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

export default function ScriptEditPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedContent, setOptimizedContent] = useState('');
  const [optimizeDialogOpen, setOptimizeDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedFields, setGeneratedFields] = useState<string[]>([]);
  const [generateReviewOpen, setGenerateReviewOpen] = useState(false);
  const [error, setError] = useState('');
  const [newField, setNewField] = useState('');
  const [fields, setFields] = useState<string[]>([]);

  const [form, setForm] = useState({ name: '', language: 'ur', content: '', is_active: true });
  function set(k: string, v: string | boolean) { setForm(p => ({ ...p, [k]: v })); }

  useEffect(() => {
    getScriptById(id).then(script => {
      if (script) {
        setForm({ name: script.name, language: script.language, content: script.content, is_active: script.is_active });
        setFields((script.extraction_fields ?? []).map(toName).filter(Boolean));
      }
      setFetching(false);
    });
  }, [id]);

  function addField(raw = newField) {
    const val = toSnake(raw);
    if (!val || fields.includes(val)) { setNewField(''); return; }
    setFields(p => [...p, val]);
    setNewField('');
  }

  function removeField(i: number) { setFields(p => p.filter((_, j) => j !== i)); }

  async function handleSuggest() {
    if (!form.content.trim()) { setError('Script content is empty — write the script first.'); return; }
    setSuggesting(true);
    setError('');
    const suggested = await suggestExtractionFields(form.content);
    if (suggested.length > 0) setFields(suggested);
    else setError('Could not suggest fields — try adding manually.');
    setSuggesting(false);
  }

  async function handleOptimize() {
    if (!form.content.trim()) { setError('Script content is empty — write the script first.'); return; }
    setOptimizing(true);
    setError('');
    const { optimizedContent: result, error: optErr } = await optimizeScript(form.content, form.language);
    setOptimizing(false);
    if (result) {
      setOptimizedContent(result);
      setOptimizeDialogOpen(true);
    } else {
      toast.error(optErr ?? 'Could not optimize the script — try again.');
    }
  }

  async function handleGenerate(topic: string) {
    setGenerating(true);
    const { content, extractionFields, error: genErr } = await generateScript(topic, form.language);
    setGenerating(false);
    if (content) {
      setGeneratedContent(content);
      setGeneratedFields(extractionFields);
      setGenerateDialogOpen(false);
      setGenerateReviewOpen(true);
    } else {
      toast.error(genErr ?? 'Could not generate a script — try again.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (!form.content.trim()) { setError('Content is required.'); return; }

    // Auto-add anything still typed in the input box
    let finalFields = [...fields];
    const pending = toSnake(newField);
    if (pending && !finalFields.includes(pending)) finalFields = [...finalFields, pending];

    setError('');
    setSaving(true);
    const result = await updateScriptApi(id, {
      name: form.name.trim(),
      language: form.language,
      content: form.content.trim(),
      is_active: form.is_active,
      extraction_fields: finalFields,
    });
    setSaving(false);
    if (result) {
      toast.success('Script updated successfully');
      router.push('/dashboard/scripts');
    } else {
      toast.error('Failed to update script');
      setError('Failed to update script.');
    }
  }

  if (fetching) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-5 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push('/dashboard/scripts')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
          <FileText className="size-4 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Edit Script</h1>
          <p className="text-sm text-muted-foreground">{form.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* 2-col grid */}
        <div className="grid grid-cols-[1.1fr_0.9fr] gap-5 items-start">

          {/* LEFT */}
          <div className="flex flex-col gap-5">
            {/* Script Details */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-sm">Script Details</CardTitle>
                <CardDescription>Name, language and status</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name" className="text-xs text-muted-foreground">Script Name *</Label>
                  <Input id="name" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Primary Language *</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<button type="button" className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-[13px] text-foreground transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />}>
                      <span className="flex-1 text-left truncate">{LANGUAGES.find(l => l.value === form.language)?.label}</span>
                      <ChevronDown className="size-3.5 shrink-0 text-muted-foreground/50" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuRadioGroup value={form.language} onValueChange={v => set('language', v)}>
                        {LANGUAGES.map(l => <DropdownMenuRadioItem key={l.value} value={l.value}>{l.label}</DropdownMenuRadioItem>)}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {/* Active toggle */}
                <div className="col-span-2">
                  <div
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3 cursor-pointer"
                    onClick={() => set('is_active', !form.is_active)}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">Active</p>
                      <p className="text-xs text-muted-foreground">Script is available to agents</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.is_active}
                      onClick={e => { e.stopPropagation(); set('is_active', !form.is_active); }}
                      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 outline-none"
                      style={{ background: form.is_active ? 'var(--chart-1)' : 'var(--border)' }}
                    >
                      <span
                        className="pointer-events-none block h-4 w-4 rounded-full shadow-sm transition-transform duration-200"
                        style={{ background: 'var(--fg-0)', transform: form.is_active ? 'translateX(16px)' : 'translateX(0)' }}
                      />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Script Content */}
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm">Script Content *</CardTitle>
                    <CardDescription>Full script text used by the RAG system</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setGenerateDialogOpen(true)}
                    >
                      <Wand2 className="size-3.5" />
                      Generate with AI
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={optimizing}
                      onClick={handleOptimize}
                    >
                      {optimizing ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                      {optimizing ? 'Optimizing…' : 'Optimize with AI'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <Textarea
                  rows={24}
                  value={form.content}
                  onChange={e => set('content', e.target.value)}
                  className="font-mono text-[12px] leading-relaxed resize-none"
                />
                <p className="text-[11px] text-muted-foreground mt-2">
                  {form.content.length} chars · ~{Math.ceil(form.content.split(/\s+/).filter(Boolean).length / 100)} chunks
                </p>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT — extraction fields */}
          <Card className="sticky top-6">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Sparkles className="size-3.5 text-muted-foreground" />
                    Extraction Fields
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Data the AI extracts from every call. Changes apply to future calls only.
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-1.5 shrink-0 mt-0.5"
                  disabled={suggesting} onClick={handleSuggest}>
                  {suggesting ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                  {suggesting ? 'Analyzing…' : 'Suggest'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-4">
              {/* Presets */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Quick Presets</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(PRESETS).map(([label, preset]) => (
                    <button key={label} type="button" onClick={() => setFields(preset)}
                      className="px-2.5 py-1.5 rounded-md border border-border text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors capitalize text-left">
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chips */}
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Defined Fields {fields.length > 0 && <span className="text-chart-1 ml-1">({fields.length})</span>}
                </p>
                {fields.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border border-border bg-muted/10 min-h-[52px]">
                    {fields.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[rgba(0,229,160,0.08)] border border-[rgba(0,229,160,0.2)] text-[11px] font-mono text-[#00E5A0]">
                        {f}
                        <button type="button" onClick={() => removeField(i)} className="text-[#00E5A0]/50 hover:text-[#FCA5A5] transition-colors">
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-6 rounded-lg border border-dashed border-border text-[11px] text-muted-foreground/50">
                    No fields yet
                  </div>
                )}
              </div>

              {/* Add input */}
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. delivery_address"
                  value={newField}
                  onChange={e => setNewField(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addField(); } }}
                  className="font-mono text-[12px]"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => addField()} className="gap-1 shrink-0">
                  <Plus className="size-3.5" /> Add
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Press <kbd className="px-1 py-0.5 rounded bg-muted/40 border border-border text-[10px]">Enter</kbd> or Add. snake_case only.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-3 pt-1 border-t border-border">
          <Button type="submit" size="sm" disabled={saving} className="gap-2">
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            Save Changes
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/dashboard/scripts')}>Cancel</Button>
        </div>
      </form>

      <ScriptReviewDialog
        open={optimizeDialogOpen}
        onOpenChange={setOptimizeDialogOpen}
        title="Review optimized script"
        description="AI filled in gaps and improved clarity — facts, prices, and numbers already in your script were kept as-is. Review before applying."
        originalContent={form.content}
        newContent={optimizedContent}
        onApply={newContent => { set('content', newContent); toast.success('Optimized script applied.'); }}
      />

      <GenerateScriptDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        generating={generating}
        onGenerate={handleGenerate}
      />

      <ScriptReviewDialog
        open={generateReviewOpen}
        onOpenChange={setGenerateReviewOpen}
        title="Review generated script"
        description="AI drafted this from your description, with placeholders for anything it couldn't know. Review before applying — this replaces the current content."
        originalContent={form.content}
        newContent={generatedContent}
        extractionFields={generatedFields}
        onApply={(newContent, extractionFieldsResult) => {
          set('content', newContent);
          if (extractionFieldsResult && extractionFieldsResult.length > 0) setFields(extractionFieldsResult);
          toast.success('Generated script applied.');
        }}
      />
    </main>
  );
}
