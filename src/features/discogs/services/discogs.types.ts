export type DiscogsSearchInput = {
  readonly query: string;
};

export type DiscogsRelease = {
  readonly discogsId: number;
  readonly title: string;
  readonly year: string;
  readonly country: string;
};

export type DiscogsReleases = ReadonlyArray<DiscogsRelease>;

