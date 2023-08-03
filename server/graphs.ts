// these objects map outgoing references from papers to other papers. the keys
// are IDs of papers from the local database. the values are arrays of paper IDs
// from the local database.

export const mentionsGraph: Record<string, string[]> = {};
export const referencesGraph: Record<string, string[]> = {};
