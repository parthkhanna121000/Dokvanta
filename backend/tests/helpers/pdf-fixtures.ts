/** Tiny synthetic PDFs. Real or personal documents are never used in tests. */
export function minimalPdf(marker = "a"): Buffer {
  return Buffer.from(
    [
      "%PDF-1.4",
      "1 0 obj",
      "<< /Type /Catalog /Pages 2 0 R >>",
      "endobj",
      "2 0 obj",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "endobj",
      "3 0 obj",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>",
      "endobj",
      `% test marker ${marker}`,
      "trailer",
      "<< /Root 1 0 R /Size 4 >>",
      "%%EOF",
      "",
    ].join("\n"),
    "latin1",
  );
}