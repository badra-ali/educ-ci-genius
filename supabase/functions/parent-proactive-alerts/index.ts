import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertRequest {
  parent_id?: string;
  check_all?: boolean;
}

interface Alert {
  type: 'grade_drop' | 'absence' | 'multiple_absences';
  child_name: string;
  child_id: string;
  message: string;
  severity: 'warning' | 'critical';
  data?: Record<string, unknown>;
}

interface GradeRecord {
  score: number;
  matiere_id: string;
  created_at: string;
  matieres: { nom: string } | null;
}

interface AttendanceRecord {
  id: string;
  status: string;
  date: string;
  reason: string | null;
  decision: string | null;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");

async function sendAlertEmail(
  parentEmail: string,
  parentName: string,
  alerts: Alert[]
): Promise<boolean> {
  if (!resendApiKey) {
    console.log("RESEND_API_KEY not configured, skipping email");
    return false;
  }

  const alertsHtml = alerts.map(alert => {
    const severityColor = alert.severity === 'critical' ? '#dc2626' : '#f59e0b';
    const severityLabel = alert.severity === 'critical' ? '⚠️ Critique' : '⚡ Attention';
    
    return `
      <div style="border-left: 4px solid ${severityColor}; padding: 15px; margin: 15px 0; background: #f9fafb; border-radius: 0 8px 8px 0;">
        <div style="font-weight: bold; color: ${severityColor}; margin-bottom: 5px;">${severityLabel}</div>
        <div style="font-weight: 600; margin-bottom: 5px;">${alert.child_name}</div>
        <div style="color: #374151;">${alert.message}</div>
      </div>
    `;
  }).join('');

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Alertes - Suivi Scolaire</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🔔 Alertes Proactives</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Suivi scolaire de vos enfants</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151; font-size: 16px;">Bonjour ${parentName},</p>
        
        <p style="color: #6b7280;">Nous avons détecté des événements importants concernant le suivi scolaire de vos enfants :</p>
        
        ${alertsHtml}
        
        <div style="margin-top: 30px; padding: 20px; background: #eff6ff; border-radius: 8px;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            💡 <strong>Conseil :</strong> N'hésitez pas à contacter l'établissement ou les enseignants pour discuter de ces points.
          </p>
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Consulter le tableau de bord
          </a>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>Cet email a été envoyé automatiquement par le système d'alertes proactives.</p>
        <p>Vous pouvez gérer vos préférences de notification dans votre espace parent.</p>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Alertes Scolaires <onboarding@resend.dev>",
        to: [parentEmail],
        subject: `🔔 ${alerts.length} alerte(s) concernant vos enfants`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to send email:", error);
      return false;
    }

    console.log("Alert email sent successfully to", parentEmail);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

async function checkGradeDrops(
  supabase: SupabaseClient,
  childId: string,
  childName: string
): Promise<Alert[]> {
  const alerts: Alert[] = [];

  // Get recent grades (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentGradesData } = await supabase
    .from('grades')
    .select('score, matiere_id, created_at, matieres(nom)')
    .eq('student_id', childId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  const recentGrades = (recentGradesData || []) as unknown as GradeRecord[];

  // Get older grades for comparison (30-90 days ago)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: olderGradesData } = await supabase
    .from('grades')
    .select('score, matiere_id')
    .eq('student_id', childId)
    .gte('created_at', ninetyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString());

  const olderGrades = (olderGradesData || []) as unknown as { score: number; matiere_id: string }[];

  if (recentGrades.length === 0) return alerts;

  // Group grades by subject
  const recentBySubject = new Map<string, { scores: number[], name: string }>();
  const olderBySubject = new Map<string, number[]>();

  for (const grade of recentGrades) {
    const subjectId = grade.matiere_id;
    const subjectName = grade.matieres?.nom || 'Matière inconnue';
    if (!recentBySubject.has(subjectId)) {
      recentBySubject.set(subjectId, { scores: [], name: subjectName });
    }
    recentBySubject.get(subjectId)!.scores.push(grade.score);
  }

  for (const grade of olderGrades) {
    const subjectId = grade.matiere_id;
    if (!olderBySubject.has(subjectId)) {
      olderBySubject.set(subjectId, []);
    }
    olderBySubject.get(subjectId)!.push(grade.score);
  }

  // Check for significant drops (more than 3 points)
  for (const [subjectId, recent] of recentBySubject) {
    const older = olderBySubject.get(subjectId);
    if (!older || older.length === 0) continue;

    const recentAvg = recent.scores.reduce((a, b) => a + b, 0) / recent.scores.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    const drop = olderAvg - recentAvg;

    if (drop >= 3) {
      alerts.push({
        type: 'grade_drop',
        child_name: childName,
        child_id: childId,
        severity: drop >= 5 ? 'critical' : 'warning',
        message: `Baisse de ${drop.toFixed(1)} points en ${recent.name} (moyenne actuelle: ${recentAvg.toFixed(1)}/20, moyenne précédente: ${olderAvg.toFixed(1)}/20)`,
        data: { subjectId, recentAvg, olderAvg, drop }
      });
    }

    // Check for low recent grade
    const lastGrade = recent.scores[0];
    if (lastGrade < 8) {
      alerts.push({
        type: 'grade_drop',
        child_name: childName,
        child_id: childId,
        severity: lastGrade < 5 ? 'critical' : 'warning',
        message: `Note très basse en ${recent.name}: ${lastGrade}/20`,
        data: { subjectId, lastGrade }
      });
    }
  }

  return alerts;
}

async function checkAbsences(
  supabase: SupabaseClient,
  childId: string,
  childName: string
): Promise<Alert[]> {
  const alerts: Alert[] = [];

  // Get recent absences (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentAbsencesData } = await supabase
    .from('attendance')
    .select('id, status, date, reason, decision')
    .eq('student_id', childId)
    .in('status', ['ABSENT', 'RETARD'])
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false });

  const recentAbsences = (recentAbsencesData || []) as unknown as AttendanceRecord[];

  if (recentAbsences.length === 0) return alerts;

  // Check for recent unexcused absences
  const unjustifiedAbsences = recentAbsences.filter(
    a => a.status === 'ABSENT' && (!a.reason || a.decision === 'REFUSE')
  );

  if (unjustifiedAbsences.length >= 3) {
    alerts.push({
      type: 'multiple_absences',
      child_name: childName,
      child_id: childId,
      severity: unjustifiedAbsences.length >= 5 ? 'critical' : 'warning',
      message: `${unjustifiedAbsences.length} absences non justifiées ces 30 derniers jours`,
      data: { count: unjustifiedAbsences.length }
    });
  }

  // Check for very recent absence (last 3 days)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const veryRecentAbsence = recentAbsences.find(a => 
    new Date(a.date) >= threeDaysAgo && 
    a.status === 'ABSENT' && 
    !a.reason
  );

  if (veryRecentAbsence) {
    const absenceDate = new Date(veryRecentAbsence.date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    alerts.push({
      type: 'absence',
      child_name: childName,
      child_id: childId,
      severity: 'warning',
      message: `Absence non justifiée le ${absenceDate}`,
      data: { date: veryRecentAbsence.date }
    });
  }

  // Check for frequent late arrivals
  const lateArrivals = recentAbsences.filter(a => a.status === 'RETARD');
  if (lateArrivals.length >= 5) {
    alerts.push({
      type: 'absence',
      child_name: childName,
      child_id: childId,
      severity: 'warning',
      message: `${lateArrivals.length} retards ces 30 derniers jours`,
      data: { count: lateArrivals.length }
    });
  }

  return alerts;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { parent_id, check_all } = await req.json() as AlertRequest;

    let parentsToCheck: { id: string; email: string; name: string }[] = [];

    if (check_all) {
      // Get all parents with their children
      const { data: parents } = await supabase
        .from('parents_view')
        .select('id, first_name, last_name');

      if (parents) {
        for (const parent of parents as { id: string; first_name: string; last_name: string }[]) {
          // Get parent email from auth
          const { data: authUser } = await supabase.auth.admin.getUserById(parent.id);
          if (authUser?.user?.email) {
            parentsToCheck.push({
              id: parent.id,
              email: authUser.user.email,
              name: `${parent.first_name} ${parent.last_name}`
            });
          }
        }
      }
    } else if (parent_id) {
      const { data: authUser } = await supabase.auth.admin.getUserById(parent_id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', parent_id)
        .single();

      if (authUser?.user?.email && profile) {
        const profileData = profile as { first_name: string; last_name: string };
        parentsToCheck.push({
          id: parent_id,
          email: authUser.user.email,
          name: `${profileData.first_name} ${profileData.last_name}`
        });
      }
    }

    const results: { parent_id: string; alerts: Alert[]; email_sent: boolean }[] = [];

    for (const parent of parentsToCheck) {
      // Get parent's children
      const { data: children } = await supabase
        .rpc('get_parent_children', { p_parent_id: parent.id });

      if (!children || (children as unknown[]).length === 0) continue;

      const allAlerts: Alert[] = [];
      const childrenData = children as { eleve_id: string; first_name: string; last_name: string }[];

      for (const child of childrenData) {
        const childName = `${child.first_name} ${child.last_name}`;
        
        // Check for grade drops
        const gradeAlerts = await checkGradeDrops(supabase, child.eleve_id, childName);
        allAlerts.push(...gradeAlerts);

        // Check for absences
        const absenceAlerts = await checkAbsences(supabase, child.eleve_id, childName);
        allAlerts.push(...absenceAlerts);
      }

      let emailSent = false;
      if (allAlerts.length > 0) {
        emailSent = await sendAlertEmail(parent.email, parent.name, allAlerts);
        
        // Create notifications in the database
        for (const alert of allAlerts) {
          await supabase.from('notifications').insert({
            user_id: parent.id,
            type: alert.type,
            title: alert.severity === 'critical' ? '⚠️ Alerte critique' : '⚡ Attention',
            message: `${alert.child_name}: ${alert.message}`,
            link: '/parent'
          });
        }
      }

      results.push({
        parent_id: parent.id,
        alerts: allAlerts,
        email_sent: emailSent
      });
    }

    console.log(`Processed ${results.length} parents, found ${results.reduce((acc, r) => acc + r.alerts.length, 0)} total alerts`);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in parent-proactive-alerts:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
