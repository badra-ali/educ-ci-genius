import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get student's class
    const { data: eleveClass, error: classError } = await supabaseClient
      .from('eleve_classes')
      .select('classe_id, classes!inner(nom)')
      .eq('user_id', user.id)
      .eq('actif', true)
      .single();

    if (classError || !eleveClass) {
      throw new Error('No active class found');
    }

    const className = (eleveClass.classes as any)?.nom || 'Classe';

    // Get all schedule items
    const { data: scheduleItems, error: scheduleError } = await supabaseClient
      .from('schedule')
      .select(`
        *,
        matiere:matiere_id(nom),
        teacher:teacher_id(id)
      `)
      .eq('classe_id', eleveClass.classe_id)
      .order('day')
      .order('start_time');

    if (scheduleError) {
      throw new Error('Failed to fetch schedule');
    }

    // Generate ICS content
    const dayMap: Record<string, string> = {
      'Lundi': 'MO',
      'Mardi': 'TU',
      'Mercredi': 'WE',
      'Jeudi': 'TH',
      'Vendredi': 'FR',
    };

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Educ-CI Genius//Schedule//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:Emploi du temps - ${className}`,
      'X-WR-TIMEZONE:Africa/Abidjan',
    ];

    if (scheduleItems) {
      for (const item of scheduleItems) {
        const dayCode = dayMap[item.day];
        if (!dayCode) continue;

        // Calculate next occurrence of this day
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday
        const targetDay = Object.keys(dayMap).indexOf(item.day) + 1; // 1 = Monday
        let daysUntilTarget = targetDay - currentDay;
        if (daysUntilTarget < 0) daysUntilTarget += 7;

        const eventDate = new Date(now);
        eventDate.setDate(now.getDate() + daysUntilTarget);

        const startTime = item.start_time.replace(/:/g, '');
        const endTime = item.end_time.replace(/:/g, '');
        const dateStr = eventDate.toISOString().split('T')[0].replace(/-/g, '');

        icsContent.push(
          'BEGIN:VEVENT',
          `UID:${item.id}@educ-ci-genius.app`,
          `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
          `DTSTART:${dateStr}T${startTime}`,
          `DTEND:${dateStr}T${endTime}`,
          `SUMMARY:${item.matiere?.nom || 'Cours'}`,
          `LOCATION:${item.room || 'Salle non spécifiée'}`,
          `RRULE:FREQ=WEEKLY;BYDAY=${dayCode}`,
          'END:VEVENT'
        );
      }
    }

    icsContent.push('END:VCALENDAR');

    const icsFile = icsContent.join('\r\n');

    return new Response(icsFile, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="emploi-du-temps-${className.replace(/\s+/g, '-')}.ics"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating ICS:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
