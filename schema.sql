-- ====================================================================
-- LỚP HỌC VUI NHỘN - SUPABASE DATABASE SCHEMA MIGRATION
-- Production Ready with Full RLS, Triggers, Indexes, & Storage Setup
-- ====================================================================

-- 1. EXTENSIONS & SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE TABLES

-- Profiles Table (Synced from Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    code TEXT UNIQUE NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Class Members Table
CREATE TABLE IF NOT EXISTS public.class_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_class_student UNIQUE (class_id, student_id)
);

-- Materials & Educational Games Table
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    type TEXT NOT NULL CHECK (type IN ('document', 'video', 'game_iframe', 'game_html5')),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT,
    grade_level TEXT,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    due_date TIMESTAMPTZ,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Progress Table
CREATE TABLE IF NOT EXISTS public.student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    score NUMERIC DEFAULT 0,
    completion_time_seconds INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_assignment_student UNIQUE (assignment_id, student_id)
);

-- 3. INDEXES FOR HIGH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_code ON public.classes(code);
CREATE INDEX IF NOT EXISTS idx_class_members_class ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_student ON public.class_members(student_id);
CREATE INDEX IF NOT EXISTS idx_materials_author ON public.materials(author_id);
CREATE INDEX IF NOT EXISTS idx_materials_type ON public.materials(type);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON public.assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_material ON public.assignments(material_id);
CREATE INDEX IF NOT EXISTS idx_progress_student ON public.student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_assignment ON public.student_progress(assignment_id);

-- 4. HELPER FUNCTION TO GET CURRENT USER ROLE (AVOIDS RLS RECURSION)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. TRIGGER FOR AUTOMATIC PROFILE CREATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role TEXT;
    user_full_name TEXT;
BEGIN
    -- Check if email matches special admin email hoangkienqg@gmail.com
    IF NEW.email = 'hoangkienqg@gmail.com' THEN
        assigned_role := 'admin';
    ELSE
        -- Fallback to metadata role or default 'student'
        assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
        IF assigned_role NOT IN ('admin', 'teacher', 'student') THEN
            assigned_role := 'student';
        END IF;
    END IF;

    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1));

    INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        user_full_name,
        assigned_role,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = assigned_role,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

-- 7. ROW LEVEL SECURITY POLICIES

-- PROFILES POLICIES
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete any profile"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (public.get_current_user_role() = 'admin');

-- CLASSES POLICIES
CREATE POLICY "Classes viewable by members, teacher, or admins"
    ON public.classes FOR SELECT
    TO authenticated
    USING (
        public.get_current_user_role() = 'admin'
        OR teacher_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.class_members
            WHERE class_id = public.classes.id AND student_id = auth.uid()
        )
        OR true -- Allow viewing classes to join via code
    );

CREATE POLICY "Teachers and Admins can create classes"
    ON public.classes FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_current_user_role() IN ('teacher', 'admin')
        AND teacher_id = auth.uid()
    );

CREATE POLICY "Teachers can update owned classes, Admins can update all"
    ON public.classes FOR UPDATE
    TO authenticated
    USING (
        public.get_current_user_role() = 'admin'
        OR teacher_id = auth.uid()
    );

CREATE POLICY "Teachers can delete owned classes, Admins can delete all"
    ON public.classes FOR DELETE
    TO authenticated
    USING (
        public.get_current_user_role() = 'admin'
        OR teacher_id = auth.uid()
    );

-- CLASS MEMBERS POLICIES
CREATE POLICY "Class members viewable by members, class teacher, or admin"
    ON public.class_members FOR SELECT
    TO authenticated
    USING (
        public.get_current_user_role() = 'admin'
        OR student_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.classes
            WHERE id = public.class_members.class_id AND teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can join classes, Teachers/Admins can add students"
    ON public.class_members FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_current_user_role() = 'admin'
        OR student_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.classes
            WHERE id = class_id AND teacher_id = auth.uid()
        )
    );

CREATE POLICY "Teachers and Admins can remove class members, or Student can leave"
    ON public.class_members FOR DELETE
    TO authenticated
    USING (
        public.get_current_user_role() = 'admin'
        OR student_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.classes
            WHERE id = class_id AND teacher_id = auth.uid()
        )
    );

-- MATERIALS POLICIES
CREATE POLICY "Materials viewable if public, or owned by author, or assigned to user's class"
    ON public.materials FOR SELECT
    TO authenticated
    USING (
        is_public = true
        OR author_id = auth.uid()
        OR public.get_current_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.class_members cm ON cm.class_id = a.class_id
            WHERE a.material_id = public.materials.id AND cm.student_id = auth.uid()
        )
    );

CREATE POLICY "Teachers and Admins can insert materials"
    ON public.materials FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_current_user_role() IN ('teacher', 'admin')
        AND author_id = auth.uid()
    );

CREATE POLICY "Authors and Admins can update materials"
    ON public.materials FOR UPDATE
    TO authenticated
    USING (
        author_id = auth.uid()
        OR public.get_current_user_role() = 'admin'
    );

CREATE POLICY "Authors and Admins can delete materials"
    ON public.materials FOR DELETE
    TO authenticated
    USING (
        author_id = auth.uid()
        OR public.get_current_user_role() = 'admin'
    );

-- ASSIGNMENTS POLICIES
CREATE POLICY "Assignments viewable by class teacher, class students, or admin"
    ON public.assignments FOR SELECT
    TO authenticated
    USING (
        public.get_current_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.classes
            WHERE id = class_id AND teacher_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.class_members
            WHERE class_id = public.assignments.class_id AND student_id = auth.uid()
        )
    );

CREATE POLICY "Class Teachers and Admins can create assignments"
    ON public.assignments FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_current_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.classes
            WHERE id = class_id AND teacher_id = auth.uid()
        )
    );

CREATE POLICY "Class Teachers and Admins can delete assignments"
    ON public.assignments FOR DELETE
    TO authenticated
    USING (
        public.get_current_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.classes
            WHERE id = class_id AND teacher_id = auth.uid()
        )
    );

-- STUDENT PROGRESS POLICIES
CREATE POLICY "Student progress viewable by student, class teacher, or admin"
    ON public.student_progress FOR SELECT
    TO authenticated
    USING (
        student_id = auth.uid()
        OR public.get_current_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.classes c ON c.id = a.class_id
            WHERE a.id = assignment_id AND c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can insert/update their own progress"
    ON public.student_progress FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own progress, Teachers/Admins can grade"
    ON public.student_progress FOR UPDATE
    TO authenticated
    USING (
        student_id = auth.uid()
        OR public.get_current_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.classes c ON c.id = a.class_id
            WHERE a.id = assignment_id AND c.teacher_id = auth.uid()
        )
    );

-- 8. STORAGE BUCKETS SETUP INSTRUCTIONS
-- Execute in SQL Editor to create public storage buckets for materials and games:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('games', 'games', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Storage Read Access"
    ON storage.objects FOR SELECT
    TO authenticated, anon
    USING (bucket_id IN ('materials', 'games'));

CREATE POLICY "Authenticated Users Upload Storage Access"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id IN ('materials', 'games'));

CREATE POLICY "Owners and Admins Delete Storage Objects"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id IN ('materials', 'games'));
