export type ReferenceKeysBase = Record<string, unknown>;

export interface ReferenceBase<
	TKey extends ReferenceKeysBase = ReferenceKeysBase,
> {
	keys: TKey;
	descr: string;
}
