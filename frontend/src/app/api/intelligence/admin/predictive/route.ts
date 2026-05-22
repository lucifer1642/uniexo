import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    // Get top LTV users
    const { data: topLtv } = await supabaseAdmin
      .from('intelligence_metrics')
      .select('*, profiles:entity_id(name, email)')
      .eq('type', 'user')
      .order('ltv_score', { ascending: false })
      .limit(10);
    
    // Get high churn risk users
    const { data: churnRisk } = await supabaseAdmin
      .from('intelligence_metrics')
      .select('*, profiles:entity_id(name, email)')
      .eq('type', 'user')
      .gt('churn_risk_score', 0.5)
      .order('churn_risk_score', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        topLtv: topLtv || [],
        churnRisk: churnRisk || []
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
