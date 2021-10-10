import type { FinderResult } from "./extract/extractcredential";
import { findCredentialForURL } from "./extract/find";
import type { ExtensionDIDStorage } from "./storage/dids";

export async function examineCredential(url: string, storage: ExtensionDIDStorage): Promise<FinderResult | undefined> {
  if (!url) {
    console.info('No URL for tab.');
    return;
  }
  const credential = await findCredentialForURL(url, storage);
  console.info('Credential report:', credential);
  return credential;
}