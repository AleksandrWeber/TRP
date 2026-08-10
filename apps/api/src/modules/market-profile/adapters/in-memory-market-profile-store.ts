/**
 * RC-25 Epic 5 — Process-local Market Profile version registry / store.
 *
 * Not a persistence product / DB schema. In-memory only.
 * Enforces immutability: existing profile ids and (targetId, version) pairs
 * cannot be overwritten.
 */

import { Injectable } from '@nestjs/common';
import type { MarketProfile } from '../domain/market-profile';
import type { MarketProfileVersion } from '../domain/market-profile-version';

@Injectable()
export class InMemoryMarketProfileStore {
  private readonly byId = new Map<string, MarketProfileVersion>();
  /** targetId → version → marketProfileId */
  private readonly versionIndex = new Map<string, Map<number, string>>();

  clear(): void {
    this.byId.clear();
    this.versionIndex.clear();
  }

  /**
   * Append-only put. Rejects overwrite of id or (targetId, version).
   */
  putProfile(profile: MarketProfile): void {
    if (this.byId.has(profile.marketProfileId)) {
      throw new Error(`profile_id_exists:${profile.marketProfileId}`);
    }
    const versions = this.versionIndex.get(profile.targetId) ?? new Map();
    if (versions.has(profile.version)) {
      throw new Error(`profile_version_exists:${profile.targetId}:v${profile.version}`);
    }
    this.byId.set(profile.marketProfileId, profile);
    versions.set(profile.version, profile.marketProfileId);
    this.versionIndex.set(profile.targetId, versions);
  }

  getById(marketProfileId: string): MarketProfileVersion | null {
    return this.byId.get(marketProfileId) ?? null;
  }

  getByVersion(targetId: string, version: number): MarketProfileVersion | null {
    const id = this.versionIndex.get(targetId)?.get(version);
    if (!id) return null;
    return this.byId.get(id) ?? null;
  }

  getLatest(targetId: string): MarketProfileVersion | null {
    const versions = this.versionIndex.get(targetId);
    if (!versions || versions.size === 0) return null;
    let latestVersion = 0;
    let latestId: string | undefined;
    for (const [version, id] of versions.entries()) {
      if (version > latestVersion) {
        latestVersion = version;
        latestId = id;
      }
    }
    return latestId ? (this.byId.get(latestId) ?? null) : null;
  }

  listByTarget(targetId: string): MarketProfileVersion[] {
    const versions = this.versionIndex.get(targetId);
    if (!versions) return [];
    return [...versions.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, id]) => this.byId.get(id)!)
      .filter(Boolean);
  }

  nextVersion(targetId: string): number {
    const latest = this.getLatest(targetId);
    return (latest?.version ?? 0) + 1;
  }
}
