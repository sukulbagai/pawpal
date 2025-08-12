-- PawPal Row Level Security Policies
-- Run this after schema.sql

-- Users table policies
-- Users can only read and update their own record
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth_user_id = auth.uid());

-- Insert will be handled via backend bootstrap endpoint
-- CREATE POLICY "Users can insert own profile" ON public.users
--     FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Admin override policy (commented for later)
-- CREATE POLICY "Admins can manage all users" ON public.users
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM public.users 
--             WHERE auth_user_id = auth.uid() AND role = 'admin'
--         )
--     );

-- Personality tags policies
-- Everyone can read personality tags
CREATE POLICY "Anyone can view personality tags" ON public.personality_tags
    FOR SELECT TO authenticated, anon USING (true);

-- Only admins can modify tags (commented for now)
-- CREATE POLICY "Admins can manage tags" ON public.personality_tags
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM public.users 
--             WHERE auth_user_id = auth.uid() AND role = 'admin'
--         )
--     );

-- Dogs table policies
-- Everyone can view all dogs
CREATE POLICY "Anyone can view dogs" ON public.dogs
    FOR SELECT TO authenticated, anon USING (true);

-- Users can insert dogs if they are the poster
CREATE POLICY "Users can post dogs" ON public.dogs
    FOR INSERT WITH CHECK (
        posted_by IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- Users can update/delete their own dogs
CREATE POLICY "Users can manage own dogs" ON public.dogs
    FOR ALL USING (
        posted_by IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- Admin override for dogs (commented)
-- CREATE POLICY "Admins can manage all dogs" ON public.dogs
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM public.users 
--             WHERE auth_user_id = auth.uid() AND role = 'admin'
--         )
--     );

-- Adoption requests policies
-- Users can view requests where they are the adopter OR the dog owner
CREATE POLICY "Users can view relevant adoption requests" ON public.adoption_requests
    FOR SELECT USING (
        adopter_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
        OR 
        dog_id IN (
            SELECT id FROM public.dogs 
            WHERE posted_by IN (
                SELECT id FROM public.users WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Users can create adoption requests for themselves
CREATE POLICY "Users can create adoption requests" ON public.adoption_requests
    FOR INSERT WITH CHECK (
        adopter_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- Dog owners can update request status, adopters cannot change status
CREATE POLICY "Dog owners can update request status" ON public.adoption_requests
    FOR UPDATE USING (
        dog_id IN (
            SELECT id FROM public.dogs 
            WHERE posted_by IN (
                SELECT id FROM public.users WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Documents table policies
-- Users can view documents for dogs they own or have applied for
CREATE POLICY "Users can view relevant documents" ON public.documents
    FOR SELECT USING (
        dog_id IN (
            -- Dogs they own
            SELECT id FROM public.dogs 
            WHERE posted_by IN (
                SELECT id FROM public.users WHERE auth_user_id = auth.uid()
            )
            UNION
            -- Dogs they have applied for
            SELECT dog_id FROM public.adoption_requests
            WHERE adopter_id IN (
                SELECT id FROM public.users WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Users can upload documents if they are the uploader
CREATE POLICY "Users can upload documents" ON public.documents
    FOR INSERT WITH CHECK (
        uploader_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
        AND
        dog_id IN (
            -- Dogs they own OR dogs they have applied for (lenient for MVP)
            SELECT id FROM public.dogs 
            WHERE posted_by IN (
                SELECT id FROM public.users WHERE auth_user_id = auth.uid()
            )
            UNION
            SELECT dog_id FROM public.adoption_requests
            WHERE adopter_id IN (
                SELECT id FROM public.users WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Users can delete their own uploaded documents
CREATE POLICY "Users can delete own documents" ON public.documents
    FOR DELETE USING (
        uploader_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );
