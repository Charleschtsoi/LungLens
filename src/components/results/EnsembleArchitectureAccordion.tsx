"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ENSEMBLE_ARCHITECTURE_ROWS } from "@/lib/ensemble-architecture";
import { useI18n } from "@/hooks/useI18n";

export function EnsembleArchitectureAccordion() {
  const { t } = useI18n();

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="ensemble" className="border-border/60">
        <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
          {t("results.ensembleArchitecture.title")}
        </AccordionTrigger>
        <AccordionContent>
          <div className="overflow-x-auto rounded-lg border border-border/70">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="whitespace-nowrap font-semibold text-foreground">
                    {t("results.ensembleArchitecture.colDisplayName")}
                  </TableHead>
                  <TableHead className="whitespace-nowrap font-semibold text-foreground">
                    {t("results.ensembleArchitecture.colArchitecture")}
                  </TableHead>
                  <TableHead className="whitespace-nowrap font-semibold text-foreground">
                    {t("results.ensembleArchitecture.colApiField")}
                  </TableHead>
                  <TableHead className="whitespace-nowrap font-semibold text-foreground">
                    {t("results.ensembleArchitecture.colTrainedBy")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Fixed Model 1→5 order — array is literal; never sort by apiField */}
                {ENSEMBLE_ARCHITECTURE_ROWS.map((row, index) => (
                  <TableRow key={`ensemble-row-${index}`}>
                    <TableCell className="font-medium text-foreground">{row.displayName}</TableCell>
                    <TableCell className="text-muted-foreground">{row.architecture}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                        {row.apiField}
                      </code>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.trainedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
