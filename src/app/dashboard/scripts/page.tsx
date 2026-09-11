'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { getScripts, deleteScriptApi } from '@/lib/api';
import type { ScriptRecord } from '@/lib/api';
import { toast } from 'sonner';

const LANG_LABELS: Record<string, string> = {
  ur: 'Urdu',
  en: 'English',
};

export default function ScriptsPage() {
  const router = useRouter();
  const [scripts, setScripts] = useState<ScriptRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScripts().then(data => { setScripts(data); setLoading(false); });
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete script "${name}"? This cannot be undone.`)) return;
    const ok = await deleteScriptApi(id);
    if (ok) {
      setScripts(prev => prev.filter(s => s.id !== id));
      toast.success(`Script "${name}" deleted`);
    } else {
      toast.error('Failed to delete script');
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Scripts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your AI call scripts</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => router.push('/dashboard/scripts/create')}>
          <Plus className="size-3.5" />
          New Script
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-muted-foreground" />
            All Scripts
          </CardTitle>
          <CardDescription>{scripts.length} script{scripts.length !== 1 ? 's' : ''} available</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
          ) : scripts.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="size-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No scripts yet.</p>
              <Button size="sm" variant="outline" className="mt-4 gap-2" onClick={() => router.push('/dashboard/scripts/create')}>
                <Plus className="size-3.5" /> Create your first script
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Name</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Language</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Preview</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
                  <TableHead className="pr-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scripts.map(script => (
                  <TableRow key={script.id} className="border-border">
                    <TableCell className="pl-6 font-medium text-foreground text-[13px]">{script.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {LANG_LABELS[script.language] ?? script.language}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[12px] text-muted-foreground max-w-xs truncate">
                      {script.content.slice(0, 80)}…
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={script.is_active ? 'border-chart-2/40 text-chart-2' : 'text-muted-foreground'}>
                        {script.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/dashboard/scripts/${script.id}/edit`)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(script.id, script.name)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
