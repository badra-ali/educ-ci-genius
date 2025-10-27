-- Create schedule table for timetable
CREATE TABLE public.schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  classe_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  matiere_id UUID NOT NULL REFERENCES public.matieres(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  day TEXT NOT NULL CHECK (day IN ('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  week_type TEXT DEFAULT 'all' CHECK (week_type IN ('all', 'A', 'B')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create grades table
CREATE TABLE public.grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matiere_id UUID NOT NULL REFERENCES public.matieres(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('Trimestre 1', 'Trimestre 2', 'Trimestre 3')),
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 20),
  coefficient NUMERIC(3,1) DEFAULT 1.0,
  validated BOOLEAN DEFAULT false,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create report_cards table
CREATE TABLE public.report_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('Trimestre 1', 'Trimestre 2', 'Trimestre 3')),
  average NUMERIC(5,2),
  rank INTEGER,
  total_students INTEGER,
  remarks TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, period)
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE')),
  reason TEXT,
  justification_url TEXT,
  validated BOOLEAN DEFAULT false,
  declared_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schedule
CREATE POLICY "Students can view their class schedule"
ON public.schedule FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.eleve_classes ec
    WHERE ec.user_id = auth.uid() 
    AND ec.classe_id = schedule.classe_id
    AND ec.actif = true
  )
);

CREATE POLICY "Teachers can view schedule"
ON public.schedule FOR SELECT
USING (
  has_role(auth.uid(), 'ENSEIGNANT'::app_role) OR 
  has_role(auth.uid(), 'ADMIN_ECOLE'::app_role)
);

CREATE POLICY "Admins can manage schedule"
ON public.schedule FOR ALL
USING (
  has_role(auth.uid(), 'ADMIN_ECOLE'::app_role) OR 
  has_role(auth.uid(), 'ADMIN_SYSTEME'::app_role)
);

-- RLS Policies for grades
CREATE POLICY "Students can view own grades"
ON public.grades FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Parents can view their children grades"
ON public.grades FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.parent_eleves pe
    WHERE pe.parent_id = auth.uid() 
    AND pe.eleve_id = grades.student_id
  )
);

CREATE POLICY "Teachers can manage grades for their subjects"
ON public.grades FOR ALL
USING (auth.uid() = teacher_id);

CREATE POLICY "Admins can manage all grades"
ON public.grades FOR ALL
USING (
  has_role(auth.uid(), 'ADMIN_ECOLE'::app_role) OR 
  has_role(auth.uid(), 'ADMIN_SYSTEME'::app_role)
);

-- RLS Policies for report_cards
CREATE POLICY "Students can view own report cards"
ON public.report_cards FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Parents can view their children report cards"
ON public.report_cards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.parent_eleves pe
    WHERE pe.parent_id = auth.uid() 
    AND pe.eleve_id = report_cards.student_id
  )
);

CREATE POLICY "Admins can manage report cards"
ON public.report_cards FOR ALL
USING (
  has_role(auth.uid(), 'ADMIN_ECOLE'::app_role) OR 
  has_role(auth.uid(), 'ADMIN_SYSTEME'::app_role)
);

-- RLS Policies for attendance
CREATE POLICY "Students can view own attendance"
ON public.attendance FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can justify own attendance"
ON public.attendance FOR UPDATE
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Parents can view their children attendance"
ON public.attendance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.parent_eleves pe
    WHERE pe.parent_id = auth.uid() 
    AND pe.eleve_id = attendance.student_id
  )
);

CREATE POLICY "Parents can justify their children attendance"
ON public.attendance FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.parent_eleves pe
    WHERE pe.parent_id = auth.uid() 
    AND pe.eleve_id = attendance.student_id
  )
);

CREATE POLICY "Teachers can declare attendance"
ON public.attendance FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ENSEIGNANT'::app_role));

CREATE POLICY "Teachers can view attendance"
ON public.attendance FOR SELECT
USING (has_role(auth.uid(), 'ENSEIGNANT'::app_role));

CREATE POLICY "Admins can manage attendance"
ON public.attendance FOR ALL
USING (
  has_role(auth.uid(), 'ADMIN_ECOLE'::app_role) OR 
  has_role(auth.uid(), 'ADMIN_SYSTEME'::app_role)
);

-- Create indexes for performance
CREATE INDEX idx_schedule_classe ON public.schedule(classe_id, day);
CREATE INDEX idx_grades_student_period ON public.grades(student_id, period);
CREATE INDEX idx_attendance_student_date ON public.attendance(student_id, date);

-- Create updated_at trigger for all tables
CREATE TRIGGER update_schedule_updated_at
BEFORE UPDATE ON public.schedule
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grades_updated_at
BEFORE UPDATE ON public.grades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_report_cards_updated_at
BEFORE UPDATE ON public.report_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();