export type FormulaDefinition = {
  column: string;
  field: string;
  label: string;
  excelFormula: string;
  applicationLogic: string;
};

export const FORMULA_CATALOG: FormulaDefinition[] = [
  {
    column: "B",
    field: "workType",
    label: "Quantity-style derived work type rows",
    excelFormula: "=(A{row}/2)*(N{row})",
    applicationLogic: "When the imported workbook contains this formula, evaluate A/2 multiplied by expired days N for that row."
  },
  {
    column: "E",
    field: "muroorStatusRemainingDate",
    label: "Muroor status remaining date",
    excelFormula: '=IFERROR(G{row}-F{row},"") or =G{row}-F{row}',
    applicationLogic: "Subtract Muroor elapsed days from Muroor permit days. Empty values propagate as an empty value, matching IFERROR behavior."
  },
  {
    column: "F",
    field: "muroorElapsedDays",
    label: "Muroor elapsed days",
    excelFormula: "=TODAY()-K{row} or =TODAY()-I{row}",
    applicationLogic: "Use the current date at request time and subtract the Muroor start date."
  },
  {
    column: "G",
    field: "muroorPermitDays",
    label: "Muroor permit days",
    excelFormula: "=J{row}-K{row} or =H{row}-I{row}",
    applicationLogic: "Subtract Muroor start from Muroor end. Gregorian-converted dates are used when the workbook formula references H/I."
  },
  {
    column: "H",
    field: "muroorGregorianEnd",
    label: "Muroor Gregorian end",
    excelFormula: "=VLOOKUP(J{row},'[1]Hijri-Gregorian-Solar_Hijri-V3'!$L:$M,2,FALSE)",
    applicationLogic: "Recreate the lookup by converting a Muroor/Hijri value to a Gregorian date. If the source value is blank or unknown, return blank."
  },
  {
    column: "I",
    field: "muroorGregorianStart",
    label: "Muroor Gregorian start",
    excelFormula: "=VLOOKUP(K{row},'[1]Hijri-Gregorian-Solar_Hijri-V3'!$L:$M,2,FALSE)",
    applicationLogic: "Recreate the lookup by converting a Muroor/Hijri value to a Gregorian date. If the source value is blank or unknown, return blank."
  },
  {
    column: "K1",
    field: "workbookToday",
    label: "Workbook current date",
    excelFormula: "=TODAY()",
    applicationLogic: "Always use the server's current date for dynamic calculations rather than storing a fixed date."
  },
  {
    column: "L",
    field: "statusRemainLength",
    label: "Status remaining length",
    excelFormula: "=19.88, =479.4-(82.45+97.3+80.03+74.98), and similar row formulas",
    applicationLogic: "Preserve the imported formula string for audit. Where the cell is manually populated, keep the workbook value."
  },
  {
    column: "M",
    field: "remainingDays",
    label: "Remaining days",
    excelFormula: "=O{row}-N{row}",
    applicationLogic: "Subtract elapsed days from permit duration. This is equivalent to work end date minus today's date."
  },
  {
    column: "N",
    field: "expiredDays",
    label: "Elapsed work days",
    excelFormula: "=TODAY()-Q{row}",
    applicationLogic: "Use the current date at request time and subtract the work start date."
  },
  {
    column: "O",
    field: "permitDays",
    label: "Permit days",
    excelFormula: "=P{row}-Q{row}",
    applicationLogic: "Subtract work start date from work end date."
  },
  {
    column: "Z",
    field: "statusCounts",
    label: "Workbook status counters",
    excelFormula: '=COUNTIF($C$6:$C$31,"تم إخلا طرف") and related COUNTIF formulas',
    applicationLogic: "Dashboard counts are calculated from imported permit statuses using the same count-by-status rule."
  },
  {
    column: "AF",
    field: "serialNumber",
    label: "Serial increment",
    excelFormula: "=SUM(AF{previousRow}+1)",
    applicationLogic: "Generate a one-based sequence when the workbook row does not provide a concrete serial value."
  },
  {
    column: "AL",
    field: "hijriDateConversion",
    label: "Hijri date conversion helper",
    excelFormula: "=DATE(1900,1,1)+MID(AI{row},1,2)+ROUNDUP(29.5*(MID(AI{row},4,2)-1),0)+(MID(AI{row},7,4)-1)*354+INT((3+11*MID(AI{row},7,4))/30)+1948440-2415021",
    applicationLogic: "Use the same arithmetic approximation to convert DD/MM/YYYY Hijri text into a Gregorian date serial."
  },
  {
    column: "AQ",
    field: "reportStartDate",
    label: "Report start mirror",
    excelFormula: "=Q{row}",
    applicationLogic: "Mirror work start date into the reporting section."
  },
  {
    column: "AR",
    field: "reportEndDate",
    label: "Report end mirror",
    excelFormula: "=P{row}",
    applicationLogic: "Mirror work end date into the reporting section."
  },
  {
    column: "AS",
    field: "reportLengthMeters",
    label: "Report length mirror",
    excelFormula: "=T{row}",
    applicationLogic: "Mirror permit length into the reporting section."
  },
  {
    column: "AT",
    field: "reportStreetName",
    label: "Report street mirror",
    excelFormula: "=Y{row}",
    applicationLogic: "Mirror street name into the reporting section."
  },
  {
    column: "AU",
    field: "reportLineNumber",
    label: "Report line mirror",
    excelFormula: "=V{row}",
    applicationLogic: "Mirror line number into the reporting section."
  }
];
