import type { FinderResult } from "../src/extract/extractcredential";
import { findCredentialForURL } from "../src/extract/find";
import type { ExtensionDIDStorage } from "./storage";

export async function examineCredential(url: string, storage: ExtensionDIDStorage): Promise<FinderResult | undefined> {
  if (!url) {
    console.info('No URL for tab.');
    return;
  }
  const credential = await findCredentialForURL(url, storage);
  console.info('Credential report:', credential);
  return credential;
}