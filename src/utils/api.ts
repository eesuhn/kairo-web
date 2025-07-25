import { PipelineResult } from '../types';

const API_BASE_URL = 'http://localhost:8000';

export class ApiClient {
  async uploadFile(file: File): Promise<PipelineResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/pipeline/full`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async healthCheck(): Promise<{ message: string; status: string }> {
    const response = await fetch(`${API_BASE_URL}/`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return await response.json();
  }
}

export const apiClient = new ApiClient();
