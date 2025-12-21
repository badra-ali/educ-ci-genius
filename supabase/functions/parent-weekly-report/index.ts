import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChildReport {
  childId: string;
  childName: string;
  className: string;
  attendanceRate: number;
  absences: number;
  lateArrivals: number;
  grades: Array<{
    subject: string;
    score: number;
    date: string;
  }>;
  averageGrade: number | null;
  upcomingAssignments: Array<{
    title: string;
    deadline: string;
    subject: string;
  }>;
}

interface ParentReport {
  parentId: string;
  parentEmail: string;
  parentName: string;
  children: ChildReport[];
  weekStart: string;
  weekEnd: string;
}

// Send email using Resend API
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "EduGenius <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting weekly report generation...");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate week range
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const weekEnd = new Date(now);

    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    console.log(`Generating reports for week: ${weekStartStr} to ${weekEndStr}`);

    // Get all parents with their children
    const { data: parentEleves, error: parentError } = await supabase
      .from("parent_eleves")
      .select(`
        parent_id,
        eleve_id,
        lien_parente
      `);

    if (parentError) {
      console.error("Error fetching parent-eleve relations:", parentError);
      throw parentError;
    }

    console.log(`Found ${parentEleves?.length || 0} parent-child relations`);

    // Group children by parent
    const parentChildren = new Map<string, string[]>();
    parentEleves?.forEach(pe => {
      const existing = parentChildren.get(pe.parent_id) || [];
      existing.push(pe.eleve_id);
      parentChildren.set(pe.parent_id, existing);
    });

    const reports: ParentReport[] = [];

    // Generate report for each parent
    for (const [parentId, childrenIds] of parentChildren) {
      console.log(`Processing parent ${parentId} with ${childrenIds.length} children`);

      // Get parent profile
      const { data: parentProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", parentId)
        .single();

      // Get parent email from auth (using service role)
      const { data: authUser } = await supabase.auth.admin.getUserById(parentId);
      
      if (!authUser?.user?.email) {
        console.log(`No email found for parent ${parentId}, skipping`);
        continue;
      }

      const childReports: ChildReport[] = [];

      for (const childId of childrenIds) {
        // Get child profile
        const { data: childProfile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", childId)
          .single();

        // Get child class
        const { data: eleveClasse } = await supabase
          .from("eleve_classes")
          .select(`
            classe_id,
            classes:classe_id (nom, niveau)
          `)
          .eq("user_id", childId)
          .eq("actif", true)
          .single();

        // Get attendance for the week
        const { data: attendance } = await supabase
          .from("attendance")
          .select("*")
          .eq("student_id", childId)
          .gte("date", weekStartStr)
          .lte("date", weekEndStr);

        const totalDays = attendance?.length || 0;
        const presentDays = attendance?.filter(a => a.status === "PRESENT").length || 0;
        const absences = attendance?.filter(a => a.status === "ABSENT").length || 0;
        const lateArrivals = attendance?.filter(a => a.status === "RETARD").length || 0;
        const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

        // Get grades for the week
        const { data: grades } = await supabase
          .from("grades")
          .select(`
            score,
            created_at,
            matieres:matiere_id (nom)
          `)
          .eq("student_id", childId)
          .gte("created_at", weekStartStr)
          .lte("created_at", weekEndStr);

        const gradesList = grades?.map(g => ({
          subject: (g.matieres as any)?.nom || "Matière",
          score: g.score,
          date: new Date(g.created_at).toLocaleDateString('fr-FR'),
        })) || [];

        const averageGrade = gradesList.length > 0 
          ? Math.round(gradesList.reduce((sum, g) => sum + g.score, 0) / gradesList.length * 10) / 10
          : null;

        // Get upcoming assignments
        const { data: assignments } = await supabase
          .from("devoirs")
          .select(`
            titre,
            deadline,
            cours:cours_id (
              matieres:matiere_id (nom)
            )
          `)
          .gte("deadline", weekEndStr)
          .lte("deadline", new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .eq("actif", true)
          .limit(5);

        const upcomingAssignments = assignments?.map(a => ({
          title: a.titre,
          deadline: new Date(a.deadline).toLocaleDateString('fr-FR'),
          subject: ((a.cours as any)?.matieres as any)?.nom || "Matière",
        })) || [];

        childReports.push({
          childId,
          childName: `${childProfile?.first_name || ""} ${childProfile?.last_name || ""}`.trim() || "Élève",
          className: (eleveClasse?.classes as any)?.nom || "Classe",
          attendanceRate,
          absences,
          lateArrivals,
          grades: gradesList,
          averageGrade,
          upcomingAssignments,
        });
      }

      reports.push({
        parentId,
        parentEmail: authUser.user.email,
        parentName: `${parentProfile?.first_name || ""} ${parentProfile?.last_name || ""}`.trim() || "Parent",
        children: childReports,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
      });
    }

    console.log(`Generated ${reports.length} parent reports`);

    // Send emails
    let sentCount = 0;
    let errorCount = 0;

    for (const report of reports) {
      const emailHtml = generateEmailHtml(report);
      const success = await sendEmail(
        report.parentEmail,
        `📚 Rapport hebdomadaire - Semaine du ${formatDate(report.weekStart)}`,
        emailHtml
      );

      if (success) {
        console.log(`Email sent to ${report.parentEmail}`);
        sentCount++;
      } else {
        console.error(`Failed to send email to ${report.parentEmail}`);
        errorCount++;
      }
    }

    console.log(`Completed: ${sentCount} emails sent, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${sentCount} rapports envoyés, ${errorCount} erreurs`,
        reportsGenerated: reports.length,
        emailsSent: sentCount,
        errors: errorCount,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in weekly report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function generateEmailHtml(report: ParentReport): string {
  const childrenSections = report.children.map(child => `
    <div style="background-color: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="color: #1a1a2e; margin: 0 0 16px 0; font-size: 20px;">
        👤 ${child.childName}
      </h2>
      <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">
        Classe : ${child.className}
      </p>

      <!-- Assiduité -->
      <div style="background: white; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <h3 style="color: #1a1a2e; margin: 0 0 12px 0; font-size: 16px;">📅 Assiduité</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="text-align: center; padding: 12px; background: ${child.attendanceRate >= 90 ? '#d4edda' : child.attendanceRate >= 75 ? '#fff3cd' : '#f8d7da'}; border-radius: 8px; width: 33%;">
              <div style="font-size: 24px; font-weight: bold; color: ${child.attendanceRate >= 90 ? '#155724' : child.attendanceRate >= 75 ? '#856404' : '#721c24'};">${child.attendanceRate}%</div>
              <div style="font-size: 12px; color: #666;">Présence</div>
            </td>
            <td style="width: 8px;"></td>
            <td style="text-align: center; padding: 12px; background: #f0f0f0; border-radius: 8px; width: 33%;">
              <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${child.absences}</div>
              <div style="font-size: 12px; color: #666;">Absences</div>
            </td>
            <td style="width: 8px;"></td>
            <td style="text-align: center; padding: 12px; background: #f0f0f0; border-radius: 8px; width: 33%;">
              <div style="font-size: 24px; font-weight: bold; color: #fd7e14;">${child.lateArrivals}</div>
              <div style="font-size: 12px; color: #666;">Retards</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Notes -->
      <div style="background: white; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <h3 style="color: #1a1a2e; margin: 0 0 12px 0; font-size: 16px;">📊 Notes de la semaine</h3>
        ${child.grades.length > 0 ? `
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f0f0f0;">
                <th style="padding: 8px; text-align: left; font-size: 12px; color: #666;">Matière</th>
                <th style="padding: 8px; text-align: center; font-size: 12px; color: #666;">Note</th>
                <th style="padding: 8px; text-align: right; font-size: 12px; color: #666;">Date</th>
              </tr>
            </thead>
            <tbody>
              ${child.grades.map(g => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 8px; font-size: 14px;">${g.subject}</td>
                  <td style="padding: 8px; text-align: center; font-weight: bold; color: ${g.score >= 14 ? '#28a745' : g.score >= 10 ? '#fd7e14' : '#dc3545'};">${g.score}/20</td>
                  <td style="padding: 8px; text-align: right; font-size: 12px; color: #666;">${g.date}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${child.averageGrade !== null ? `
            <div style="margin-top: 12px; padding: 12px; background: #e8f4fd; border-radius: 8px; text-align: center;">
              <span style="font-size: 14px; color: #0066cc;">Moyenne de la semaine : </span>
              <span style="font-size: 18px; font-weight: bold; color: #0066cc;">${child.averageGrade}/20</span>
            </div>
          ` : ''}
        ` : `
          <p style="color: #666; font-size: 14px; text-align: center; padding: 12px;">
            Aucune note cette semaine
          </p>
        `}
      </div>

      <!-- Devoirs à venir -->
      <div style="background: white; border-radius: 8px; padding: 16px;">
        <h3 style="color: #1a1a2e; margin: 0 0 12px 0; font-size: 16px;">📝 Devoirs à venir</h3>
        ${child.upcomingAssignments.length > 0 ? `
          <ul style="margin: 0; padding-left: 20px;">
            ${child.upcomingAssignments.map(a => `
              <li style="margin-bottom: 8px; font-size: 14px;">
                <strong>${a.title}</strong> (${a.subject})<br>
                <span style="color: #666; font-size: 12px;">📅 ${a.deadline}</span>
              </li>
            `).join('')}
          </ul>
        ` : `
          <p style="color: #666; font-size: 14px; text-align: center; padding: 12px;">
            Aucun devoir prévu pour les deux prochaines semaines
          </p>
        `}
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f0f2f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📚 Rapport Hebdomadaire</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
            Semaine du ${formatDate(report.weekStart)} au ${formatDate(report.weekEnd)}
          </p>
        </div>

        <!-- Main content -->
        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px;">
          <p style="color: #1a1a2e; font-size: 16px; margin: 0 0 24px 0;">
            Bonjour ${report.parentName},
          </p>
          <p style="color: #666; font-size: 14px; margin: 0 0 24px 0;">
            Voici le résumé de la semaine scolaire de vos enfants :
          </p>

          ${childrenSections}

          <!-- Footer -->
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Ce rapport est généré automatiquement par EduGenius.<br>
              Pour plus de détails, connectez-vous à votre espace parent.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}