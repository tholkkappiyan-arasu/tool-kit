// src/lib/api.ts
import { invoke } from '@tauri-apps/api';

export interface RequestConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  certPath?: string;
  keyPath?: string;
  caPath?: string;
  skipVerification?: boolean;
}

export interface ResponseData {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export async function sendRequest(config: RequestConfig): Promise<ResponseData> {
  try {
    const response = await invoke<ResponseData>('send_request', { config });
    return response;
  } catch (error) {
    throw new Error(`Failed to send request: ${error}`);
  }
}

// Certificate management functions
export async function selectCertificateFile(): Promise<string> {
  try {
    const { dialog } = await import('@tauri-apps/api');
    const selected = await dialog.open({
      filters: [{
        name: 'Certificates',
        extensions: ['pem', 'crt', 'cer']
      }]
    });
    return selected as string;
  } catch (error) {
    throw new Error(`Failed to select certificate: ${error}`);
  }
}