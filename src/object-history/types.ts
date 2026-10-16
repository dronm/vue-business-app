export type ObjectHistoryValue = unknown;

export interface ObjectHistoryChangeDTO {
	column: string;
	field: string;
	old: ObjectHistoryValue;
	new: ObjectHistoryValue;
	old_description?: string | null;
	new_description?: string | null;
}

export type ObjectHistoryChange = ObjectHistoryChangeDTO;

export interface ObjectHistoryRowDTO {
	id: number;
	changed_at: string;
	operation: string;
	changed_by: string | null;
	changes: ObjectHistoryChangeDTO[];
}

export interface ObjectHistoryRow extends Omit<ObjectHistoryRowDTO, "changed_at" | "changes"> {
	changed_at: Date;
	changes: ObjectHistoryChange[];
}

export interface ObjectHistoryResponseDTO {
	rows: ObjectHistoryRowDTO[];
	total: number;
}

export interface ObjectHistoryResponse {
	rows: ObjectHistoryRow[];
	total: number;
}

export interface ObjectHistoryListQuery {
	objectType: string;
	objectId: string | number;
	from?: number;
	count?: number;
}
