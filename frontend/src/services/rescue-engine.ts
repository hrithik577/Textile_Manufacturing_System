import { request } from './api-client';
import { RescueIssue } from '../types';
import { mockRescueIssues } from './mock-data';

export const rescueEngineService = {
  async getIssues(): Promise<{ data: RescueIssue[]; isSimulated: boolean }> {
    // Backend returns data in RescueIssue shape from /rescue-engine/issues
    return request<RescueIssue[]>(
      '/rescue-engine/issues',
      { method: 'GET', allowReadFallback: true },
      mockRescueIssues
    );
  },

  async getIssueById(id: string): Promise<{ data: RescueIssue | null; isSimulated: boolean }> {
    const fallback = mockRescueIssues.find((i) => i.id === id || i.issueCode === id) || null;
    return request<RescueIssue | null>(
      `/rescue-engine/issues/${id}`,
      { method: 'GET', allowReadFallback: true },
      fallback
    );
  },

  async approveRecoveryPlan(
    issueId: string,
    planId: string,
    approverName: string,
    notes?: string
  ): Promise<{ success: boolean; isSimulated: boolean }> {
    const res = await request<{ success: boolean }>(
      `/rescue-engine/issues/${issueId}/approve-plan`,
      {
        method: 'POST',
        body: JSON.stringify({ planId, approverName, notes }),
      },
      { success: true }
    );
    return { success: res.data.success, isSimulated: res.isSimulated };
  },

  async rejectPlan(
    issueId: string,
    planId: string,
    reason: string
  ): Promise<{ success: boolean; isSimulated: boolean }> {
    const res = await request<{ success: boolean }>(
      `/rescue-engine/issues/${issueId}/reject-plan`,
      {
        method: 'POST',
        body: JSON.stringify({ planId, reason }),
      },
      { success: true }
    );
    return { success: res.data.success, isSimulated: res.isSimulated };
  },
};
