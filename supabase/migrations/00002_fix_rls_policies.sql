-- Fix RLS Policies for Staff/Team Member Access

-- 1. TEAM MEMBERS Policy Update
DROP POLICY IF EXISTS "Users can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Owners can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view own team member status" ON public.team_members;

-- Owners can do anything (ALL)
CREATE POLICY "Owners can manage team members"
    ON public.team_members FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id AND owner_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id AND owner_id = (SELECT auth.uid())
        )
    );

-- Members can view their own membership status (SELECT)
CREATE POLICY "Users can view own team member status"
    ON public.team_members FOR SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()));


-- 2. BUSINESSES Policy Update
DROP POLICY IF EXISTS "Owner can manage businesses" ON public.businesses;
DROP POLICY IF EXISTS "Team members can view businesses" ON public.businesses;

-- Owners can do anything (ALL)
CREATE POLICY "Owner can manage businesses"
    ON public.businesses FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = owner_id)
    WITH CHECK ((SELECT auth.uid()) = owner_id);

-- Team members can view their businesses (SELECT)
CREATE POLICY "Team members can view businesses"
    ON public.businesses FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE business_id = id AND user_id = (SELECT auth.uid())
        )
    );


-- 3. PRODUCTS Policy Update
DROP POLICY IF EXISTS "Users can manage products" ON public.products;
DROP POLICY IF EXISTS "Allow select products" ON public.products;
DROP POLICY IF EXISTS "Allow insert products" ON public.products;
DROP POLICY IF EXISTS "Allow update products" ON public.products;
DROP POLICY IF EXISTS "Allow delete products" ON public.products;

-- SELECT: Owner OR team members of the business can read products
CREATE POLICY "Allow select products"
    ON public.products FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id AND owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE business_id = products.business_id AND user_id = (SELECT auth.uid())
        )
    );

-- INSERT/UPDATE/DELETE: Owner OR team members with can_manage_stock = true
CREATE POLICY "Allow insert products"
    ON public.products FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id AND owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE business_id = products.business_id AND user_id = (SELECT auth.uid()) AND can_manage_stock = true
        )
    );

CREATE POLICY "Allow update products"
    ON public.products FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id AND owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE business_id = products.business_id AND user_id = (SELECT auth.uid()) AND can_manage_stock = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id AND owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE business_id = products.business_id AND user_id = (SELECT auth.uid()) AND can_manage_stock = true
        )
    );

CREATE POLICY "Allow delete products"
    ON public.products FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id AND owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE business_id = products.business_id AND user_id = (SELECT auth.uid()) AND can_manage_stock = true
        )
    );


-- 4. TRANSACTIONS Policy Update
DROP POLICY IF EXISTS "Users can manage transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow select transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow delete transactions" ON public.transactions;

-- SELECT: Owner OR team members can read transactions
CREATE POLICY "Allow select transactions"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id AND owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE business_id = transactions.business_id AND user_id = (SELECT auth.uid())
        )
    );

-- INSERT/UPDATE/DELETE: Owner OR team members with can_create_transaction = true
CREATE POLICY "Allow insert transactions"
    ON public.transactions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id AND owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE business_id = transactions.business_id AND user_id = (SELECT auth.uid()) AND can_create_transaction = true
        )
    );

CREATE POLICY "Allow update transactions"
    ON public.transactions FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id AND owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE business_id = transactions.business_id AND user_id = (SELECT auth.uid()) AND can_create_transaction = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id AND owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE business_id = transactions.business_id AND user_id = (SELECT auth.uid()) AND can_create_transaction = true
        )
    );

CREATE POLICY "Allow delete transactions"
    ON public.transactions FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id AND owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE business_id = transactions.business_id AND user_id = (SELECT auth.uid()) AND can_create_transaction = true
        )
    );


-- 5. SUBSCRIPTIONS Policy Update
DROP POLICY IF EXISTS "Users can view subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow view subscriptions" ON public.subscriptions;

CREATE POLICY "Allow view subscriptions"
    ON public.subscriptions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id AND owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE business_id = subscriptions.business_id AND user_id = (SELECT auth.uid())
        )
    );


-- 6. INVOICES Policy Update
DROP POLICY IF EXISTS "Users can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow select invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow delete invoices" ON public.invoices;

CREATE POLICY "Allow select invoices"
    ON public.invoices FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id AND owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE business_id = invoices.business_id AND user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Allow insert invoices"
    ON public.invoices FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id AND owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE business_id = invoices.business_id AND user_id = (SELECT auth.uid()) AND can_create_transaction = true
        )
    );

CREATE POLICY "Allow update invoices"
    ON public.invoices FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id AND owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE business_id = invoices.business_id AND user_id = (SELECT auth.uid()) AND can_create_transaction = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id AND owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE business_id = invoices.business_id AND user_id = (SELECT auth.uid()) AND can_create_transaction = true
        )
    );

CREATE POLICY "Allow delete invoices"
    ON public.invoices FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id AND owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE business_id = invoices.business_id AND user_id = (SELECT auth.uid()) AND can_create_transaction = true
        )
    );


-- 7. INVOICE ITEMS Policy Update
DROP POLICY IF EXISTS "Users can manage invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Allow select invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Allow insert/update/delete invoice items" ON public.invoice_items;

CREATE POLICY "Allow select invoice items"
    ON public.invoice_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices i
            JOIN public.businesses b ON b.id = i.business_id
            WHERE i.id = invoice_id AND b.owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.invoices i
            JOIN public.team_members tm ON tm.business_id = i.business_id
            WHERE i.id = invoice_id AND tm.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Allow insert/update/delete invoice items"
    ON public.invoice_items FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices i
            JOIN public.businesses b ON b.id = i.business_id
            WHERE i.id = invoice_id AND b.owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.invoices i
            JOIN public.team_members tm ON tm.business_id = i.business_id
            WHERE i.id = invoice_id AND tm.user_id = (SELECT auth.uid()) AND tm.can_create_transaction = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invoices i
            JOIN public.businesses b ON b.id = i.business_id
            WHERE i.id = invoice_id AND b.owner_id = (SELECT auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.invoices i
            JOIN public.team_members tm ON tm.business_id = i.business_id
            WHERE i.id = invoice_id AND tm.user_id = (SELECT auth.uid()) AND tm.can_create_transaction = true
        )
    );
