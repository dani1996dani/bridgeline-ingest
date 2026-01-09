'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, AlertTriangle, FileText, Trash2 } from 'lucide-react';
import { Proposal } from '@/types/Proposal';
import { PdfViewer } from '@/components/pdf-viewer';

interface ProposalDetailSheetProps {
  proposal: Proposal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProposalDetailSheet({
  proposal,
  open,
  onOpenChange,
}: ProposalDetailSheetProps) {
  const getConfidenceStyle = (field: string) => {
    if (!proposal?.analysis) return '';
    const confidence = proposal.analysis[field]?.confidence;
    if (confidence === 'LOW' || confidence === 'MEDIUM') {
      return 'border-amber-400 focus-visible:ring-amber-400 bg-amber-50/10';
    }
    return '';
  };

  const showWarning = (field: string) => {
    if (!proposal?.analysis) return false;
    const confidence = proposal.analysis[field]?.confidence;
    return confidence === 'LOW' || confidence === 'MEDIUM';
  };

  if (!proposal) return null;

  const isPdf = proposal.fileName.toLowerCase().endsWith('.pdf');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[90vw] max-w-[90vw] sm:max-w-[90vw] p-0 overflow-hidden flex flex-row gap-0">
        {/* Left Panel: Document Viewer */}
        <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-r relative hidden md:block overflow-hidden">
          {proposal.fileUrl ? (
            isPdf ? (
              <PdfViewer url={proposal.fileUrl} />
            ) : (
              <iframe
                src={proposal.fileUrl}
                className="w-full h-full border-none"
                title="Document Preview"
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
              <FileText className="h-12 w-12 mb-4 opacity-20" />
              <p>No document preview available.</p>
            </div>
          )}
          {!isPdf && proposal.fileUrl && (
            <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-md border shadow-sm text-xs font-medium flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              Document Preview
            </div>
          )}
        </div>

        {/* Right Panel: Form */}
        <div className="w-full md:w-[600px] flex flex-col h-full bg-white dark:bg-zinc-950">
          <SheetHeader className="px-6 py-6 border-b">
            <SheetTitle>Review Extraction</SheetTitle>
            <SheetDescription>
              Verify and correct extracted data
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 px-6 py-6">
            <div className="space-y-6">
              {/* Warning Banner */}
              {(proposal.overallConfidence === 'LOW' ||
                proposal.overallConfidence === 'MEDIUM') && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-500">
                        Low confidence detected
                      </h4>
                      <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                        Some fields may need manual verification. Highlighted
                        fields have lower extraction confidence.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <div className="relative">
                    <Input
                      id="companyName"
                      defaultValue={proposal.companyName || ''}
                      className={getConfidenceStyle('companyName')}
                    />
                    {showWarning('companyName') && (
                      <AlertCircle className="absolute right-3 top-2.5 h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name</Label>
                  <div className="relative">
                    <Input
                      id="contactName"
                      defaultValue={proposal.contactName || ''}
                      className={getConfidenceStyle('contactName')}
                    />
                    {showWarning('contactName') && (
                      <AlertCircle className="absolute right-3 top-2.5 h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      defaultValue={proposal.email || ''}
                      className={getConfidenceStyle('email')}
                    />
                    {showWarning('email') && (
                      <AlertCircle className="absolute right-3 top-2.5 h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      defaultValue={proposal.phone || ''}
                      className={getConfidenceStyle('phone')}
                    />
                    {showWarning('phone') && (
                      <AlertCircle className="absolute right-3 top-2.5 h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade">Trade</Label>
                  <Select defaultValue={proposal.trade || undefined}>
                    <SelectTrigger className={getConfidenceStyle('trade')}>
                      <SelectValue placeholder="Select a trade" />
                    </SelectTrigger>
                    <SelectContent>
                      {/*todo: add all values to match the prompt to gemini*/}
                      <SelectItem value="Plumbing">Plumbing</SelectItem>
                      <SelectItem value="HVAC">HVAC</SelectItem>
                      <SelectItem value="Electrical">Electrical</SelectItem>
                      <SelectItem value="Concrete">Concrete</SelectItem>
                      <SelectItem value="Carpentry">Carpentry</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </ScrollArea>

          <SheetFooter className="px-6 py-4 border-t gap-2 sm:justify-between bg-zinc-50/50 dark:bg-zinc-900/50 justify-center items-end flex-col">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white max-w-[200px]">
              Confirm & Save
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
