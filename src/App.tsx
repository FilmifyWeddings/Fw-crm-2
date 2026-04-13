/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Settings as SettingsIcon, 
  Plus, 
  Search, 
  Grid, 
  List,
  Sparkles,
  Database,
  Calendar,
  MapPin,
  Phone,
  Mail,
  MoreVertical,
  Trash2,
  Edit,
  ChevronRight,
  Clock,
  MessageSquare,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { Toaster, toast } from 'sonner';
import { Lead, ColumnDefinition, DEFAULT_COLUMNS, Note } from './types';
import { sheetsService } from './services/googleSheetsService';
import { analyzeLead, suggestFollowUp } from './services/geminiService';
import { format } from 'date-fns';

// --- Components ---

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '20px', fontFamily: 'sans-serif' }}>
          <div style={{ maxWidth: '400px', width: '100%', border: '1px solid #fee2e2', borderRadius: '12px', padding: '24px', background: '#fef2f2' }}>
            <h2 style={{ color: '#ef4444', marginTop: 0 }}>App Crash</h2>
            <p style={{ color: '#666', fontSize: '14px' }}>Something went wrong while rendering the app.</p>
            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace', overflow: 'auto', maxHeight: '150px', marginBottom: '16px' }}>
              {this.state.error?.message}
            </div>
            <button 
              onClick={() => window.location.reload()}
              style={{ width: '100%', padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <Sparkles size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight">LensFlow</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10' 
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="p-4 bg-accent/50 rounded-2xl border border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Database Status</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${sheetsService.getWebAppUrl() ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
            <span className="text-sm font-medium">
              {sheetsService.getWebAppUrl() ? 'Connected' : 'Setup Required'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const LeadCard = ({ lead, onClick, onDelete }: { lead: Lead, onClick: () => void, onDelete: () => void }) => {
  const colorMap: Record<string, string> = {
    'White': 'bg-slate-100 text-slate-800 border-slate-200',
    'Red': 'bg-red-100 text-red-800 border-red-200',
    'Dark Green': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Yellow': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Card className="overflow-hidden cursor-pointer border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 bg-card/50 backdrop-blur-sm" onClick={onClick}>
        <CardHeader className="p-5 pb-2">
          <div className="flex justify-between items-start">
            <Badge variant="outline" className={`${colorMap[lead.color] || 'bg-accent'} border font-medium`}>
              {lead.leadFrom}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger 
                render={
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={16} />
                  </Button>
                }
                onClick={(e) => e.stopPropagation()}
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
                  <Edit size={14} className="mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                  <Trash2 size={14} className="mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardTitle className="text-lg font-bold mt-2 leading-tight">
            {lead.clientName || lead.Name || lead.Client || 'Unnamed Client'}
          </CardTitle>
          <CardDescription className="flex items-center gap-1.5 mt-1 font-medium">
            <Calendar size={14} /> {lead.weddingDate || lead.Date || lead.wedding_date || 'No Date Set'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-2 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin size={14} />
              <span className="truncate">{lead.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground justify-end">
              <span className="font-bold text-foreground">₹{lead.budget}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                {(lead.designatedTo || lead.clientName || '?').charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-muted-foreground">{lead.designatedTo || 'Unassigned'}</span>
            </div>
            {lead.aiScore && (
              <div className="flex items-center gap-1">
                <Sparkles size={12} className="text-yellow-500" />
                <span className="text-xs font-bold">{lead.aiScore}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('leads');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [webAppUrl, setWebAppUrl] = useState(sheetsService.getWebAppUrl());

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    // 1. Check if we have cached data to show immediately
    const cachedData = localStorage.getItem("LENSFLOW_CACHED_LEADS");
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (parsed.length > 0) {
          setLeads(parsed);
          // If we have cache, we don't show the full-screen loader
          // but we might still want to fetch fresh data in the background
        } else {
          setIsLoading(true);
        }
      } catch (e) {
        setIsLoading(true);
      }
    } else {
      setIsLoading(true);
    }

    const data = await sheetsService.fetchLeads();
    setLeads(data);
    setIsLoading(false);
  };

  const handleAddLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newLead: Lead = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      leadFrom: formData.get('leadFrom') as string,
      color: formData.get('color') as string,
      clientName: formData.get('clientName') as string,
      number: formData.get('number') as string,
      weddingDate: formData.get('weddingDate') as string,
      month: formData.get('month') as string,
      designatedTo: formData.get('designatedTo') as string,
      afterQuote: formData.get('afterQuote') as string,
      wpAutomation: formData.get('wpAutomation') === 'on',
      location: formData.get('location') as string,
      budget: formData.get('budget') as string,
      function: formData.get('function') as string,
      mailId: formData.get('mailId') as string,
      notes: [],
    };

    setIsLoading(true);
    const success = await sheetsService.saveLead(newLead);
    if (success) {
      setLeads([newLead, ...leads]);
      setIsFormOpen(false);
      toast.success('Lead added successfully');
    } else {
      toast.error('Failed to save lead to Google Sheets');
    }
    setIsLoading(false);
  };

  const handleUpdateLead = async (updatedLead: Lead) => {
    const success = await sheetsService.updateLead(updatedLead);
    if (success) {
      setLeads(leads.map(l => l.id === updatedLead.id ? updatedLead : l));
      setSelectedLead(updatedLead);
      toast.success('Lead updated');
    }
  };

  const handleDeleteLead = async (id: string) => {
    const success = await sheetsService.deleteLead(id);
    if (success) {
      setLeads(leads.filter(l => l.id !== id));
      toast.success('Lead deleted');
    }
  };

  const handleAddNote = (leadId: string, text: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const newNote: Note = {
      id: Date.now().toString(),
      text,
      timestamp: new Date().toLocaleString(),
    };

    const updatedLead = {
      ...lead,
      notes: [newNote, ...lead.notes]
    };

    handleUpdateLead(updatedLead);
  };

  const handleAIAnalyze = async (lead: Lead) => {
    toast.promise(analyzeLead(lead), {
      loading: 'Analyzing lead with Gemini...',
      success: (result) => {
        const updatedLead = { ...lead, aiScore: result.score, aiSummary: result.summary };
        handleUpdateLead(updatedLead);
        return 'Analysis complete!';
      },
      error: 'Analysis failed'
    });
  };

  const filteredLeads = leads.filter(l => 
    (l.clientName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.number || "").includes(searchQuery)
  );

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] text-foreground font-sans selection:bg-primary/10">
      <Toaster position="top-right" richColors />
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-20 border-b border-border bg-card/30 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Search leads by name, location or phone..." 
                className="pl-10 bg-background/50 border-border/50 focus:ring-primary/20 rounded-xl h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLoading && leads.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse mr-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                Refreshing...
              </div>
            )}
            <div className="flex bg-accent/50 p-1 rounded-xl border border-border/50">
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="icon" 
                onClick={() => setViewMode('grid')}
                className="rounded-lg h-9 w-9"
              >
                <Grid size={18} />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="icon" 
                onClick={() => setViewMode('list')}
                className="rounded-lg h-9 w-9"
              >
                <List size={18} />
              </Button>
            </div>
            
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger 
                render={
                  <Button className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20 gap-2">
                    <Plus size={18} /> Add Lead
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-[600px] rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">New Lead Entry</DialogTitle>
                  <DialogDescription>Fill in the details to add a new photography lead.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddLead} className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Client Name</label>
                    <Input name="clientName" placeholder="Client Name" required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Phone Number</label>
                    <Input name="number" placeholder="91XXXXXXXXXX" required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Lead From</label>
                    <select name="leadFrom" className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm">
                      {DEFAULT_COLUMNS.find(c => c.id === 'leadFrom')?.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Function Type</label>
                    <select name="function" className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm">
                      {DEFAULT_COLUMNS.find(c => c.id === 'function')?.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Wedding Date</label>
                    <Input name="weddingDate" placeholder="e.g. 25 Oct 25" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Location</label>
                    <Input name="location" placeholder="City" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Budget</label>
                    <Input name="budget" placeholder="Amount" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Designated To</label>
                    <Input name="designatedTo" placeholder="Team Member" className="rounded-xl" />
                  </div>
                  <DialogFooter className="col-span-2 pt-4">
                    <Button type="submit" className="w-full rounded-xl h-12" disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Create Lead'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1 p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'leads' && (
              <motion.div
                key="leads"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">Leads Pipeline</h2>
                    <p className="text-muted-foreground font-medium">Manage and track your photography inquiries</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="px-3 py-1 rounded-lg font-bold">
                      Total: {leads.length}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1 rounded-lg font-bold border-primary/20 text-primary">
                      New: {leads.filter(l => l.color === 'White').length}
                    </Badge>
                  </div>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-48 bg-accent/30 rounded-3xl animate-pulse border border-border/50" />
                    ))}
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredLeads.map(lead => (
                      <LeadCard 
                        key={lead.id} 
                        lead={lead} 
                        onClick={() => setSelectedLead(lead)}
                        onDelete={() => handleDeleteLead(lead.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-accent/50 border-b border-border/50">
                          <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Client</th>
                          <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Source</th>
                          <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                          <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Location</th>
                          <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Budget</th>
                          <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                          <th className="p-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map(lead => (
                          <tr key={lead.id} className="border-b border-border/30 hover:bg-accent/20 transition-colors cursor-pointer" onClick={() => setSelectedLead(lead)}>
                            <td className="p-4">
                              <div className="font-bold">{lead.clientName}</div>
                              <div className="text-xs text-muted-foreground">{lead.number}</div>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline" className="rounded-lg">{lead.leadFrom}</Badge>
                            </td>
                            <td className="p-4 text-sm font-medium">{lead.weddingDate}</td>
                            <td className="p-4 text-sm font-medium">{lead.location}</td>
                            <td className="p-4 text-sm font-bold">₹{lead.budget}</td>
                            <td className="p-4">
                              <div className={`w-3 h-3 rounded-full ${lead.color === 'Red' ? 'bg-red-500' : lead.color === 'Dark Green' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            </td>
                            <td className="p-4 text-right">
                              <Button variant="ghost" size="icon" className="rounded-lg">
                                <ChevronRight size={18} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="rounded-3xl border-none shadow-xl shadow-primary/5 bg-primary text-primary-foreground overflow-hidden relative">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                    <CardHeader>
                      <CardTitle className="text-lg opacity-80">Total Revenue Potential</CardTitle>
                      <CardDescription className="text-4xl font-black text-white">
                        ₹{leads.reduce((acc, l) => {
                          const budgetStr = String(l.budget || "0");
                          return acc + (parseInt(budgetStr.replace(/[^0-9]/g, '')) || 0);
                        }, 0).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="rounded-3xl border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-lg text-muted-foreground">Conversion Rate</CardTitle>
                      <CardDescription className="text-4xl font-black text-foreground">
                        {Math.round((leads.filter(l => l.color === 'Dark Green').length / (leads.length || 1)) * 100)}%
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="rounded-3xl border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-lg text-muted-foreground">Active Leads</CardTitle>
                      <CardDescription className="text-4xl font-black text-foreground">
                        {leads.filter(l => l.color !== 'Red').length}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="rounded-3xl border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar size={20} className="text-primary" /> Upcoming Events
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {leads.slice(0, 5).map(l => (
                          <div key={l.id} className="flex items-center justify-between p-3 rounded-2xl bg-accent/30 border border-border/30">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-background flex flex-col items-center justify-center border border-border/50">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">{l.month}</span>
                                <span className="text-sm font-black leading-none">25</span>
                              </div>
                              <div>
                                <p className="font-bold text-sm">{l.clientName}</p>
                                <p className="text-xs text-muted-foreground">{l.function}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="rounded-lg">{l.location}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles size={20} className="text-yellow-500" /> AI Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 space-y-4">
                        <p className="text-sm font-medium leading-relaxed">
                          Gemini has identified <span className="font-bold text-yellow-600">3 high-value leads</span> in Mumbai this month. 
                          Suggested action: Send personalized wedding portfolios to "Nikhil Jangam" and "IamAyush Singh".
                        </p>
                        <Button variant="outline" className="w-full rounded-xl border-yellow-500/20 hover:bg-yellow-500/10 hover:text-yellow-600">
                          View High-Value Leads
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-black tracking-tight">System Configuration</h2>
                  <p className="text-muted-foreground font-medium">Connect your Google Sheets backend</p>
                </div>

                <Card className="rounded-3xl border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database size={20} className="text-primary" /> Google Apps Script URL
                    </CardTitle>
                    <CardDescription>
                      Paste your deployed Apps Script Web App URL here to sync data.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://script.google.com/macros/s/.../exec" 
                        className="rounded-xl h-12"
                        value={webAppUrl}
                        onChange={(e) => setWebAppUrl(e.target.value)}
                      />
                      <Button 
                        className="rounded-xl h-12 px-6"
                        onClick={() => {
                          sheetsService.setWebAppUrl(webAppUrl);
                          toast.success('Settings saved');
                          loadLeads();
                        }}
                      >
                        Save & Sync
                      </Button>
                    </div>

                    <div className="p-4 bg-accent/30 rounded-2xl border border-border/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold flex items-center gap-2">
                          <Clock size={14} /> Setup Instructions
                        </h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 rounded-lg text-xs gap-2"
                          onClick={() => {
                            const code = `function doGet(e) {\n  var action = e.parameter.action;\n  if (action == 'getLeads') {\n    return ContentService.createTextOutput(JSON.stringify({ leads: getLeadsFromSheet() }))\n      .setMimeType(ContentService.MimeType.JSON);\n  }\n}\n\nfunction doPost(e) {\n  var data = JSON.parse(e.postData.contents);\n  var action = data.action;\n  \n  if (action == 'saveLead') {\n    saveLeadToSheet(data.lead);\n  } else if (action == 'updateLead') {\n    updateLeadInSheet(data.lead);\n  } else if (action == 'deleteLead') {\n    deleteLeadFromSheet(data.id);\n  }\n  \n  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))\n    .setMimeType(ContentService.MimeType.JSON);\n}\n\nfunction getLeadsFromSheet() {\n  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');\n  if (!sheet) return [];\n  \n  var data = sheet.getDataRange().getValues();\n  var headers = data[0];\n  var leads = [];\n  \n  for (var i = 1; i < data.length; i++) {\n    var lead = {};\n    for (var j = 0; j < headers.length; j++) {\n      var key = headers[j].toString().toLowerCase().replace(/ /g, '');\n      if (headers[j] == 'Notes') {\n        try {\n          lead.notes = JSON.parse(data[i][j] || '[]');\n        } catch(e) {\n          lead.notes = [];\n        }\n      } else {\n        lead[key] = data[i][j];\n      }\n    }\n    leads.push(lead);\n  }\n  return leads;\n}\n\nfunction saveLeadToSheet(lead) {\n  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');\n  if (!sheet) {\n    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Leads');\n    sheet.appendRow(['ID', 'Date', 'Lead From', 'Color', 'Client Name', 'Number', 'Wedding Date', 'Month', 'Designated to', 'After Quote', 'WP Automation', 'Location', 'Budget', 'Function', 'Mail ID', 'Notes', 'AI Score', 'AI Summary']);\n  }\n  \n  sheet.appendRow([\n    lead.id,\n    lead.date,\n    lead.leadFrom,\n    lead.color,\n    lead.clientName,\n    lead.number,\n    lead.weddingDate,\n    lead.month,\n    lead.designatedTo,\n    lead.afterQuote,\n    lead.wpAutomation,\n    lead.location,\n    lead.budget,\n    lead.function,\n    lead.mailId,\n    JSON.stringify(lead.notes || []),\n    lead.aiScore || '',\n    lead.aiSummary || ''\n  ]);\n}\n\nfunction updateLeadInSheet(lead) {\n  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');\n  var data = sheet.getDataRange().getValues();\n  for (var i = 1; i < data.length; i++) {\n    if (data[i][0] == lead.id) {\n      sheet.getRange(i + 1, 1, 1, 18).setValues([[\n        lead.id,\n        lead.date,\n        lead.leadFrom,\n        lead.color,\n        lead.clientName,\n        lead.number,\n        lead.weddingDate,\n        lead.month,\n        lead.designatedTo,\n        lead.afterQuote,\n        lead.wpAutomation,\n        lead.location,\n        lead.budget,\n        lead.function,\n        lead.mailId,\n        JSON.stringify(lead.notes || []),\n        lead.aiScore || '',\n        lead.aiSummary || ''\n      ]]);\n      break;\n    }\n  }\n}\n\nfunction deleteLeadFromSheet(id) {\n  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');\n  var data = sheet.getDataRange().getValues();\n  for (var i = 1; i < data.length; i++) {\n    if (data[i][0] == id) {\n      sheet.deleteRow(i + 1);\n      break;\n    }\n  }\n}`;
                            navigator.clipboard.writeText(code);
                            toast.success('Apps Script code copied to clipboard!');
                          }}
                        >
                          <Copy size={14} /> Copy Code
                        </Button>
                      </div>
                      <ol className="text-xs text-muted-foreground space-y-2 list-decimal pl-4">
                        <li>Create a new Google Sheet.</li>
                        <li>Go to Extensions &gt; Apps Script.</li>
                        <li>Copy the template from our documentation.</li>
                        <li>Click "Deploy" &gt; "New Deployment" &gt; "Web App".</li>
                        <li>Set "Execute as" to "Me" and "Who has access" to "Anyone".</li>
                        <li>Paste the URL above.</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </main>

      {/* Lead Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent className="sm:max-w-[600px] p-0 border-l border-border/50 bg-card/80 backdrop-blur-2xl">
          {selectedLead && (
            <div className="h-full flex flex-col">
              <div className="p-8 border-b border-border/50 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge className="mb-2 rounded-lg">{selectedLead.function}</Badge>
                    <h2 className="text-3xl font-black tracking-tight">{selectedLead.clientName}</h2>
                    <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1">
                      <Phone size={14} /> {selectedLead.number}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="rounded-xl h-12 w-12" onClick={() => handleAIAnalyze(selectedLead)}>
                      <Sparkles size={20} className="text-yellow-500" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl h-12 w-12">
                      <Edit size={20} />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-accent/30 rounded-2xl border border-border/30">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Budget</p>
                    <p className="text-lg font-black">₹{selectedLead.budget}</p>
                  </div>
                  <div className="p-4 bg-accent/30 rounded-2xl border border-border/30">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Location</p>
                    <p className="text-lg font-black truncate">{selectedLead.location}</p>
                  </div>
                  <div className="p-4 bg-accent/30 rounded-2xl border border-border/30">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Source</p>
                    <p className="text-lg font-black">{selectedLead.leadFrom}</p>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="notes" className="flex-1 flex flex-col">
                <div className="px-8 border-b border-border/50">
                  <TabsList className="bg-transparent h-14 gap-8">
                    <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 border-primary rounded-none h-full px-0 font-bold">
                      Timeline & Notes
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 border-primary rounded-none h-full px-0 font-bold">
                      AI Insights
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1 p-8">
                  <TabsContent value="notes" className="m-0 space-y-8">
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input 
                          id="new-note"
                          placeholder="Add a note about this client..." 
                          className="rounded-xl h-12 bg-background/50"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddNote(selectedLead.id, e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <Button className="rounded-xl h-12 w-12 p-0" onClick={() => {
                          const input = document.getElementById('new-note') as HTMLInputElement;
                          if (input.value) {
                            handleAddNote(selectedLead.id, input.value);
                            input.value = '';
                          }
                        }}>
                          <Plus size={20} />
                        </Button>
                      </div>

                      <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-border/50">
                        {selectedLead.notes.length > 0 ? (
                          selectedLead.notes.map((note) => (
                            <div key={note.id} className="relative pl-10">
                              <div className="absolute left-3 top-2 w-2 h-2 rounded-full bg-primary ring-4 ring-background" />
                              <div className="p-4 bg-accent/20 rounded-2xl border border-border/30">
                                <p className="text-sm font-medium leading-relaxed">{note.text}</p>
                                <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-wider">
                                  {note.timestamp}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 text-muted-foreground">
                            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No notes yet. Start the conversation!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ai" className="m-0 space-y-6">
                    {selectedLead.aiSummary ? (
                      <div className="space-y-6">
                        <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10">
                          <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Sparkles size={16} /> Lead Analysis
                          </h4>
                          <div className="flex items-center gap-4 mb-6">
                            <div className="text-5xl font-black text-primary">{selectedLead.aiScore}</div>
                            <div className="text-sm font-medium text-muted-foreground">
                              Quality Score based on budget, location, and wedding type.
                            </div>
                          </div>
                          <p className="text-sm font-medium leading-relaxed text-foreground/80 italic">
                            "{selectedLead.aiSummary}"
                          </p>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-sm font-bold uppercase tracking-widest">Recommended Follow-up</h4>
                          <div className="p-6 rounded-3xl bg-accent/30 border border-border/30 relative group">
                            <p className="text-sm font-medium leading-relaxed">
                              "Hi {selectedLead.clientName}, I saw you're planning a {selectedLead.function} in {selectedLead.location}. I'd love to share some of our recent work from that area and discuss how we can capture your special day..."
                            </p>
                            <Button variant="ghost" size="sm" className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              Copy
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-4">
                        <Sparkles size={48} className="mx-auto text-yellow-500 opacity-20" />
                        <p className="text-muted-foreground font-medium">Run AI Analysis to get insights for this lead.</p>
                        <Button className="rounded-xl" onClick={() => handleAIAnalyze(selectedLead)}>
                          Analyze with Gemini
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
