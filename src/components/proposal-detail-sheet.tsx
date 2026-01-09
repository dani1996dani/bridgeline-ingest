import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { Proposal } from '@/types/Proposal';
import { PdfViewer } from '@/components/pdf-viewer';
import { updateProposal } from '@/actions/update-proposal';
import { toast } from 'sonner';
import { ConfidenceLevel } from '@/types/Confidence';

const proposalFormSchema = z.object({
  companyName: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  trade: z.string().optional(),
});

type ProposalFormValues = z.infer<typeof proposalFormSchema>;

interface ProposalDetailSheetProps {
  proposal: Proposal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (id: string, updates: Partial<Proposal>) => void;
}

export function ProposalDetailSheet({
  proposal,
  open,
  onOpenChange,
  onUpdate,
}: ProposalDetailSheetProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isDirty, isSubmitting, dirtyFields },
  } = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    values: {
      companyName: proposal?.companyName || '',
      contactName: proposal?.contactName || '',
      email: proposal?.email || '',
      phone: proposal?.phone || '',
      trade: proposal?.trade || '',
    },
  });

  const onSubmit = async (data: ProposalFormValues) => {
    if (!proposal) return;

    // Use dirtyFields to find exactly what changed
    const updates: Record<string, string> = {};
    (Object.keys(dirtyFields) as Array<keyof ProposalFormValues>).forEach(
      (key) => {
        // If the field is dirty, we include its current value from 'data'
        if (dirtyFields[key]) {
          updates[key] = data[key] || '';
        }
      }
    );

    if (Object.keys(updates).length === 0) return;

    const result = await updateProposal(proposal.id, updates);

    if (result.success) {
      toast.success('Changes saved successfully');

      // Optimistic Update
      if (onUpdate) {
        onUpdate(proposal.id, updates);
      }

      router.refresh();
      onOpenChange(false);
    } else {
      toast.error('Failed to save changes');
    }
  };

  const getConfidenceStyle = (field: string) => {
    if (!proposal?.fields) return '';
    const confidence = proposal.fields[field]?.confidence;
    if (confidence === 'LOW' || confidence === 'MEDIUM') {
      return 'border-amber-400 focus-visible:ring-amber-400 bg-amber-50/10';
    }
    return '';
  };

  const showWarning = (field: string) => {
    if (!proposal?.fields) return false;
    const confidence = proposal.fields[field]?.confidence;
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
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                <FileText className="h-16 w-16 mb-4 opacity-20" />
                <p className="mb-4 text-sm font-medium">
                  Preview not available for this file type.
                </p>
                <Button variant="outline" asChild>
                  <a
                    href={proposal.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Original File
                  </a>
                </Button>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
              <FileText className="h-12 w-12 mb-4 opacity-20" />
              <p>No document preview available.</p>
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
              {[ConfidenceLevel.LOW, ConfidenceLevel.MEDIUM].includes(
                proposal.overallConfidence
              ) && (
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

              <form
                id="extraction-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <div className="relative">
                    <Input
                      id="companyName"
                      {...register('companyName')}
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
                      {...register('contactName')}
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
                      {...register('email')}
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
                      {...register('phone')}
                      className={getConfidenceStyle('phone')}
                    />
                    {showWarning('phone') && (
                      <AlertCircle className="absolute right-3 top-2.5 h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade">Trade</Label>
                  <div className="relative">
                    <Input
                      id="trade"
                      {...register('trade')}
                      className={getConfidenceStyle('trade')}
                    />
                    {showWarning('trade') && (
                      <AlertCircle className="absolute right-3 top-2.5 h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>
              </form>
            </div>
          </ScrollArea>

          <SheetFooter className="px-6 py-4 border-t gap-2 sm:justify-between bg-zinc-50/50 dark:bg-zinc-900/50 justify-center items-end flex-col">
            <Button
              type="submit"
              form="extraction-form"
              className="bg-blue-600 hover:bg-blue-700 text-white max-w-[200px]"
              disabled={!isDirty || isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm & Save
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
