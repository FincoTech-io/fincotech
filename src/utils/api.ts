const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function fetchCompanyInfo() {
  const response = await fetch(`${API_URL}/company`);
  if (!response.ok) {
    throw new Error('Failed to fetch company information');
  }
  return response.json();
}