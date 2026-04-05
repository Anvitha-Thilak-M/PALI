import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { action, ...payload } = await req.json()

    if (action !== 'seed-demo') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'No authorization header' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(
        authHeader.replace('Bearer ', '')
      )
      if (authError || !caller) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
        _user_id: caller.id, _role: 'admin'
      })
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    if (action === 'create') {
      return await handleCreate(supabaseAdmin, payload)
    }

    if (action === 'update') {
      return await handleUpdate(supabaseAdmin, payload)
    }

    if (action === 'delete') {
      const { userId } = payload
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'list') {
      const { role } = payload
      const { data: roleUsers } = await supabaseAdmin.from('user_roles')
        .select('user_id').eq('role', role)
      
      if (!roleUsers || roleUsers.length === 0) {
        return new Response(JSON.stringify({ users: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const userIds = roleUsers.map((r: any) => r.user_id)
      const { data: profiles } = await supabaseAdmin.from('profiles')
        .select('*').in('id', userIds)

      return new Response(JSON.stringify({ users: profiles || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'seed-demo') {
      const demoUsers = [
        { email: 'admin01@pallicare.demo', password: 'Admin@123', name: 'Admin User', username: 'admin01', role: 'admin' },
        { email: 'doctor01@pallicare.demo', password: 'Doctor@123', name: 'Dr. Sarah Wilson', username: 'doctor01', role: 'doctor', specialization: 'Palliative Medicine', department: 'Oncology' },
        { email: 'caregiver01@pallicare.demo', password: 'Care@123', name: 'James Martinez', username: 'caregiver01', role: 'caregiver' },
        { email: 'patient01@pallicare.demo', password: 'Patient@123', name: 'Emily Johnson', username: 'patient01', role: 'patient', emergencyContact: '+1-555-0100' },
      ]

      const results = []
      for (const u of demoUsers) {
        const { data: existing } = await supabaseAdmin.from('profiles')
          .select('id').eq('username', u.username).maybeSingle()
        
        if (existing) {
          results.push({ username: u.username, status: 'already exists' })
          continue
        }

        const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { name: u.name, username: u.username }
        })
        if (error) {
          results.push({ username: u.username, status: 'error', error: error.message })
          continue
        }

        const profileUpdate: Record<string, any> = {}
        if (u.specialization) profileUpdate.specialization = u.specialization
        if (u.emergencyContact) profileUpdate.emergency_contact = u.emergencyContact
        if ((u as any).department) profileUpdate.department = (u as any).department
        
        if (Object.keys(profileUpdate).length > 0) {
          await supabaseAdmin.from('profiles').update(profileUpdate).eq('id', newUser.user.id)
        }

        await supabaseAdmin.from('user_roles').insert({ user_id: newUser.user.id, role: u.role })
        results.push({ username: u.username, status: 'created' })
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('manage-user error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function validatePhone(phone: string | undefined): string | null {
  if (phone && phone.replace(/\D/g, '').length !== 10) {
    return 'Phone number must be exactly 10 digits'
  }
  return null
}

function buildProfileUpdate(payload: any, role?: string): Record<string, any> {
  const {
    phone, specialization, emergencyContact, gender, dateOfBirth,
    bloodGroup, bystanderName, bystanderPhone, bystanderRelation,
    address, age, disease, yearsOfTreatment, diagnosedYear,
    treatmentStatus, assignedDoctorId, assignedCaregiverId, department,
    name,
  } = payload

  const update: Record<string, any> = {}
  
  if (name !== undefined) update.name = name || null
  if (phone !== undefined) update.phone = phone || null
  if (specialization !== undefined) update.specialization = specialization || null
  if (emergencyContact !== undefined) update.emergency_contact = emergencyContact || null
  if (gender !== undefined) update.gender = gender || null
  if (dateOfBirth !== undefined) update.date_of_birth = dateOfBirth || null
  if (bloodGroup !== undefined) update.blood_group = bloodGroup || null
  if (bystanderName !== undefined) update.bystander_name = bystanderName || null
  if (bystanderPhone !== undefined) update.bystander_phone = bystanderPhone || null
  if (bystanderRelation !== undefined) update.bystander_relation = bystanderRelation || null
  if (address !== undefined) update.address = address || null

  const effectiveRole = role || payload.role
  if (effectiveRole === 'patient') {
    if (age !== undefined) update.age = age || null
    if (disease !== undefined) update.disease = disease || null
    if (yearsOfTreatment !== undefined) update.years_of_treatment = yearsOfTreatment || null
    if (diagnosedYear !== undefined) update.diagnosed_year = diagnosedYear || null
    if (treatmentStatus !== undefined) update.treatment_status = treatmentStatus || null
    if (assignedDoctorId !== undefined) update.assigned_doctor_id = assignedDoctorId || null
    if (assignedCaregiverId !== undefined) update.assigned_caregiver_id = assignedCaregiverId || null
  }
  if (effectiveRole === 'doctor') {
    if (department !== undefined) update.department = department || null
  }

  return update
}

async function handleCreate(supabaseAdmin: any, payload: any) {
  const { password, name, username, phone, role, bystanderPhone } = payload
  const userEmail = `${username}@pallicare.local`

  const phoneErr = validatePhone(phone)
  if (phoneErr) {
    return new Response(JSON.stringify({ error: phoneErr }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  const bPhoneErr = validatePhone(bystanderPhone)
  if (bPhoneErr) {
    return new Response(JSON.stringify({ error: 'Bystander phone must be exactly 10 digits' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Check for existing username first
  const { data: existingProfile } = await supabaseAdmin.from('profiles')
    .select('id').eq('username', username).maybeSingle()
  if (existingProfile) {
    return new Response(JSON.stringify({ error: 'Username already exists' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Create auth user
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: userEmail,
    password,
    email_confirm: true,
    user_metadata: { name, username }
  })
  if (createError) {
    console.error('Auth user creation failed:', createError)
    return new Response(JSON.stringify({ error: createError.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Wait briefly for the trigger to create the profile
  await new Promise(resolve => setTimeout(resolve, 500))

  // Update profile with additional fields
  const profileUpdate = buildProfileUpdate(payload, role)
  if (Object.keys(profileUpdate).length > 0) {
    const { error: profileError } = await supabaseAdmin.from('profiles')
      .update(profileUpdate).eq('id', newUser.user.id)
    if (profileError) {
      console.error('Profile update failed:', profileError)
      // Don't fail the whole operation - user was created successfully
    }
  }

  // Insert role
  const { error: roleError } = await supabaseAdmin.from('user_roles')
    .insert({ user_id: newUser.user.id, role })
  if (roleError) {
    console.error('Role insert failed:', roleError)
    // Don't fail - user was created
  }

  return new Response(JSON.stringify({ user: newUser.user }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleUpdate(supabaseAdmin: any, payload: any) {
  const { userId, role, phone, bystanderPhone } = payload

  const phoneErr = validatePhone(phone)
  if (phoneErr) {
    return new Response(JSON.stringify({ error: phoneErr }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  const bPhoneErr = validatePhone(bystanderPhone)
  if (bPhoneErr) {
    return new Response(JSON.stringify({ error: 'Bystander phone must be exactly 10 digits' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const profileUpdate = buildProfileUpdate(payload, role)

  const { error } = await supabaseAdmin.from('profiles').update(profileUpdate).eq('id', userId)
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if (payload.name) {
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { name: payload.name }
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
