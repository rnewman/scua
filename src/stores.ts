import { derived, writable } from 'svelte/store';
import type { DIDIdentity } from './lib/id';

export const self = writable<DIDIdentity | undefined>(undefined);
export const selfURI = derived(self, ($self, set) => {
  if ($self) {
    $self.getURI().then(set);
  }
});