import { NextRequest, NextResponse } from 'next/server';
import { findTrainsByRoute } from '@/lib/trains-db';
import { ApiResponse } from '@/types/api';
import { SearchResult } from '@/types/train';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';

  if (!origin.trim() || !destination.trim()) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Origin and destination are required.',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  const trains = findTrainsByRoute(origin, destination).map((train) => ({
    id: train.number,
    number: train.number,
    name: train.name,
    origin: { code: train.fromCode, name: train.from },
    destination: { code: train.toCode, name: train.to },
  }));

  return NextResponse.json<ApiResponse<SearchResult[]>>({
    success: true,
    data: trains,
    timestamp: new Date().toISOString(),
  });
}
