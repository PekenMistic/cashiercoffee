// Helper to detect PostgreSQL FK violation errors
export function isFKViolation(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('foreign key') || msg.includes('violates') ||
         msg.includes('23503') || msg.includes('referenced');
}

export function fkError(entity: string, reason: string) {
  return Response.json(
    { error: `Tidak bisa hapus ${entity}: ${reason}` },
    { status: 400 }
  );
}
