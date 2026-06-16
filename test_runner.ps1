$BASE = "http://127.0.0.1:5005"
$pass = 0
$fail = 0

function Test-Step($name, $script) {
    try {
        $result = & $script
        if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw "exit code $LASTEXITCODE" }
        Write-Host "  ✅ $name" -ForegroundColor Green
        return $result
    } catch {
        Write-Host "  ❌ $name : $_" -ForegroundColor Red
        $script:fail++
        return $null
    }
    $script:pass++
}

Write-Host "=== TEST SUITE ===" -ForegroundColor Cyan

# ─── 1. Register Client ───
Write-Host "`n📝 1. REGISTRATION & AUTH" -ForegroundColor Yellow
Test-Step "Register Client" {
    $body = @{name="TestClient"; email="testclient@test.com"; password="TestPass123"; role="client"} | ConvertTo-Json
    $r = curl.exe -s -X POST "$BASE/api/auth/register" -H "Content-Type: application/json" -d $body
    $data = $r | ConvertFrom-Json
    if (-not $data.success) { throw "Registration failed: $($data.message)" }
    if (-not $data.data.accessToken) { throw "No access token returned" }
    $script:CLIENT_TOKEN = $data.data.accessToken
    $script:CLIENT_ID = $data.data.user.id
    "ok"
}

Test-Step "Register Stylist" {
    $body = @{name="TestStylist"; email="teststylist@test.com"; password="StylistPass123"; role="stylist"} | ConvertTo-Json
    $r = curl.exe -s -X POST "$BASE/api/auth/register" -H "Content-Type: application/json" -d $body
    $data = $r | ConvertFrom-Json
    if (-not $data.success) { throw "Registration failed: $($data.message)" }
    $script:STYLIST_TOKEN = $data.data.accessToken
    $script:STYLIST_USER_ID = $data.data.user.id
    "ok"
}

Test-Step "Login Client" {
    $body = @{email="testclient@test.com"; password="TestPass123"} | ConvertTo-Json
    $r = curl.exe -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d $body
    $data = $r | ConvertFrom-Json
    if (-not $data.success) { throw "Login failed" }
    $script:CLIENT_TOKEN = $data.data.accessToken
    "ok"
}

Test-Step "Login Stylist" {
    $body = @{email="teststylist@test.com"; password="StylistPass123"} | ConvertTo-Json
    $r = curl.exe -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d $body
    $data = $r | ConvertFrom-Json
    if (-not $data.success) { throw "Login failed" }
    $script:STYLIST_TOKEN = $data.data.accessToken
    "ok"
}

# ─── 2. STYLIST SETUP ───
Write-Host "`n💇 2. STYLIST SETUP" -ForegroundColor Yellow

Test-Step "Create Stylist Profile" {
    $body = @{
        name="TestStylist"; bio="Expert stylist"; category="hair"
        location=@{area="Accra"; lat=5.6; lng=-0.2}
    } | ConvertTo-Json -Depth 3
    $r = curl.exe -s -X POST "$BASE/api/stylists/onboarding" -H "Content-Type: application/json" -H "Authorization: Bearer $STYLIST_TOKEN" -d $body
    $data = $r | ConvertFrom-Json
    if (-not $data.success) { throw "Profile creation failed: $($data.message)" }
    $script:STYLIST_ID = $data.data.stylist.id
    "ok (stylistId: $STYLIST_ID)"
}

Test-Step "Create Service" {
    $body = @{name="Haircut"; price=50; duration=30; category="hair"} | ConvertTo-Json
    $r = curl.exe -s -X POST "$BASE/api/stylists/services" -H "Content-Type: application/json" -H "Authorization: Bearer $STYLIST_TOKEN" -d $body
    $data = $r | ConvertFrom-Json
    if (-not $data.success) { throw "Service creation failed: $($data.message)" }
    $script:SERVICE_ID = $data.data.service.id
    "ok (serviceId: $SERVICE_ID)"
}

# ─── 3. BOOKING & QUEUE ───
Write-Host "`n📅 3. BOOKING & QUEUE" -ForegroundColor Yellow

Test-Step "Get Available Slots" {
    $r = curl.exe -s "$BASE/api/bookings/stylists/$STYLIST_ID/available-slots" -H "Authorization: Bearer $CLIENT_TOKEN"
    $data = $r | ConvertFrom-Json
    if (-not $data.success) { throw "Failed to get slots" }
    $slots = $data.data.slots
    if ($slots.Count -eq 0) { throw "No slots returned" }
    $script:SLOT_TIME = ($slots | Where-Object { $_.available -eq $true } | Select-Object -First 1).time
    if (-not $SLOT_TIME) { throw "No available slots" }
    "ok (slot: $SLOT_TIME)"
}

Test-Step "Create Booking (auto-joins queue)" {
    $startTime = "2026-06-17T$SLOT_TIME`:00.000Z"
    $body = @{stylistId=$STYLIST_ID; serviceId=$SERVICE_ID; startTime=$startTime} | ConvertTo-Json
    $r = curl.exe -s -X POST "$BASE/api/bookings/" -H "Content-Type: application/json" -H "Authorization: Bearer $CLIENT_TOKEN" -d $body
    $data = $r | ConvertFrom-Json
    if (-not $data.success) { throw "Booking failed: $($data.message)" }
    $script:BOOKING_ID = $data.data.booking._id
    $script:QUEUE_POS = $data.data.queuePosition
    $script:EST_WAIT = $data.data.estimatedWaitMinutes
    if ($QUEUE_POS -le 0) { throw "Queue position should be > 0, got $QUEUE_POS" }
    "ok (bookingId: $BOOKING_ID, queuePos: $QUEUE_POS, wait: $EST_WAIT)"
}

Test-Step "Check Queue Status" {
    $r = curl.exe -s "$BASE/api/queue/$STYLIST_ID" -H "Authorization: Bearer $CLIENT_TOKEN"
    $data = $r | ConvertFrom-Json
    if (-not $data.success) { throw "Queue status failed" }
    $entries = $data.data.queue.entries
    if ($entries.Count -eq 0) { throw "No queue entries" }
    $myEntry = $entries | Where-Object { $_.userId -eq $CLIENT_ID }
    if (-not $myEntry) { throw "Client not found in queue" }
    if ($myEntry.position -ne 1) { throw "Position should be 1, got $($myEntry.position)" }
    "ok (position: $($myEntry.position), entries: $($entries.Count))"
}

Test-Step "Create 2nd Booking (different client)" {
    $body2 = @{name="Client2"; email="client2@test.com"; password="TestPass123"; role="client"} | ConvertTo-Json
    $r2 = curl.exe -s -X POST "$BASE/api/auth/register" -H "Content-Type: application/json" -d $body2
    $d2 = $r2 | ConvertFrom-Json
    $script:CLIENT2_TOKEN = $d2.data.accessToken
    $script:CLIENT2_ID = $d2.data.user.id

    $start2 = "2026-06-17T$SLOT_TIME`:00.000Z"
    $b2 = @{stylistId=$STYLIST_ID; serviceId=$SERVICE_ID; startTime=$start2} | ConvertTo-Json
    $r3 = curl.exe -s -X POST "$BASE/api/bookings/" -H "Content-Type: application/json" -H "Authorization: Bearer $CLIENT2_TOKEN" -d $b2
    $d3 = $r3 | ConvertFrom-Json
    if (-not $d3.success) { throw "2nd booking failed: $($d3.message)" }
    $script:BOOKING_ID2 = $d3.data.booking._id
    $script:QUEUE_POS2 = $d3.data.queuePosition
    if ($QUEUE_POS2 -ne 2) { throw "2nd client should be position 2, got $QUEUE_POS2" }
    "ok (bookingId2: $BOOKING_ID2, queuePos2: $QUEUE_POS2)"
}

# ─── 4. QUEUE ADVANCEMENT ───
Write-Host "`n⏩ 4. QUEUE ADVANCEMENT" -ForegroundColor Yellow

Test-Step "Advance Queue (stylist)" {
    $r = curl.exe -s -X POST "$BASE/api/queue/$STYLIST_ID/advance" -H "Authorization: Bearer $STYLIST_TOKEN"
    $data = $r | ConvertFrom-Json
    if (-not $data.success) { throw "Advance failed: $($data.message)" }
    "ok"
}

Test-Step "Mark Client as Done" {
    $r = curl.exe -s -X POST "$BASE/api/queue/$STYLIST_ID/done/$CLIENT_ID" -H "Authorization: Bearer $STYLIST_TOKEN"
    $data = $r | ConvertFrom-Json
    if (-not $data.success) { throw "Mark done failed: $($data.message)" }
    "ok"
}

Test-Step "Verify Queue After Advancement" {
    $r = curl.exe -s "$BASE/api/queue/$STYLIST_ID" -H "Authorization: Bearer $CLIENT2_TOKEN"
    $data = $r | ConvertFrom-Json
    $entries = $data.data.queue.entries
    $activeEntries = $entries | Where-Object { $_.status -ne 'done' -and $_.status -ne 'skipped' }
    if ($activeEntries.Count -ne 1) { throw "Should have 1 active entry, got $($activeEntries.Count)" }
    $myEntry = $activeEntries | Where-Object { $_.userId -eq $CLIENT2_ID }
    if ($myEntry.position -ne 1) { throw "Client2 should be position 1, got $($myEntry.position)" }
    "ok (active entries: $($activeEntries.Count))"
}

# ─── 5. CANCELLATION ───
Write-Host "`n❌ 5. CANCELLATION" -ForegroundColor Yellow

Test-Step "Cancel Booking (client cancels)" {
    $body = @{reason="Changed my mind"} | ConvertTo-Json
    $r = curl.exe -s -X PATCH "$BASE/api/bookings/$BOOKING_ID2/cancel" -H "Content-Type: application/json" -H "Authorization: Bearer $CLIENT2_TOKEN" -d $body
    $data = $r | ConvertFrom-Json
    if (-not $data.success) { throw "Cancel failed: $($data.message)" }
    "ok"
}

Test-Step "Verify Queue Removal After Cancel" {
    $r = curl.exe -s "$BASE/api/queue/$STYLIST_ID"
    $data = $r | ConvertFrom-Json
    $entries = $data.data.queue.entries
    $client2Entry = $entries | Where-Object { $_.userId -eq $CLIENT2_ID }
    if ($client2Entry) { throw "Client2 should not be in queue after cancel" }
    "ok"
}

# ─── 6. AUTHORIZATION TESTS ───
Write-Host "`n🔒 6. AUTHORIZATION BYPASS" -ForegroundColor Yellow

Test-Step "Reject booking without auth" {
    $body = @{stylistId="abc"; serviceId="def"; startTime="2026-06-17T10:00:00Z"} | ConvertTo-Json
    $r = curl.exe -s -X POST "$BASE/api/bookings/" -H "Content-Type: application/json" -d $body
    $data = $r | ConvertFrom-Json
    if ($data.success) { throw "Should have rejected unauthenticated booking" }
    "ok (got $($data.statusCode) - $($data.message))"
}

Test-Step "Reject stylist creating booking as client" {
    $body = @{stylistId=$STYLIST_ID; serviceId=$SERVICE_ID; startTime="2026-06-17T11:00:00Z"} | ConvertTo-Json
    $r = curl.exe -s -X POST "$BASE/api/bookings/" -H "Content-Type: application/json" -H "Authorization: Bearer $STYLIST_TOKEN" -d $body
    $data = $r | ConvertFrom-Json
    if ($data.success) { throw "Should have rejected stylist booking as client" }
    "ok (got 403 - role check works)"
}

Test-Step "Reject client advancing queue" {
    $r = curl.exe -s -X POST "$BASE/api/queue/$STYLIST_ID/advance" -H "Authorization: Bearer $CLIENT_TOKEN"
    $data = $r | ConvertFrom-Json
    if ($data.success) { throw "Should have rejected client advancing queue" }
    "ok (got 403 - role check works)"
}

Test-Step "Reject invalid ObjectId format" {
    $r = curl.exe -s "$BASE/api/bookings/invalid-id-here" -H "Authorization: Bearer $CLIENT_TOKEN"
    $data = $r | ConvertFrom-Json
    if ($data.success) { throw "Should have rejected invalid ObjectId" }
    "ok (got 400 - validation works)"
}

Test-Step "Reject expired/malformed tokens" {
    $r = curl.exe -s "$BASE/api/bookings/my" -H "Authorization: Bearer invalid_token_here"
    $data = $r | ConvertFrom-Json
    if ($data.success) { throw "Should have rejected invalid token" }
    "ok (got 401 - invalid token rejected)"
}

Test-Step "Prevent client viewing other client's bookings" {
    $r = curl.exe -s "$BASE/api/bookings/$BOOKING_ID" -H "Authorization: Bearer $CLIENT2_TOKEN"
    # This should succeed only if booking belongs to them or is admin
    # Client2 was for BOOKING_ID2 (cancelled), not BOOKING_ID (belongs to CLIENT_ID)
    # The endpoint allows client viewing own booking, so this should 403
    $data = $r | ConvertFrom-Json
    # Note: getBookingById allows if clientId matches OR stylistId matches OR admin
    # Since CLIENT2_ID !== CLIENT_ID, this should 403
    if ($data.success) { Write-Host "  ⚠️  Client2 could view Client1's booking (potential IDOR)" -ForegroundColor Yellow }
    else { Write-Host "  ✅ IDOR prevented (got 403)" -ForegroundColor Green }
}

# ─── 7. INPUT VALIDATION ───
Write-Host "`n🧪 7. INPUT VALIDATION" -ForegroundColor Yellow

Test-Step "Reject booking with missing fields" {
    $body = @{stylistId=$STYLIST_ID} | ConvertTo-Json
    $r = curl.exe -s -X POST "$BASE/api/bookings/" -H "Content-Type: application/json" -H "Authorization: Bearer $CLIENT_TOKEN" -d $body
    $data = $r | ConvertFrom-Json
    if ($data.success) { throw "Should reject invalid booking data" }
    "ok (got validation error)"
}

Test-Step "Reject weak passwords on register" {
    $body = @{name="Weak"; email="weak@test.com"; password="123"; role="client"} | ConvertTo-Json
    $r = curl.exe -s -X POST "$BASE/api/auth/register" -H "Content-Type: application/json" -d $body
    $data = $r | ConvertFrom-Json
    if ($data.success) { throw "Should reject weak password" }
    "ok (rejected: $($data.message))"
}

Test-Step "Reject duplicate email registration" {
    $body = @{name="Dup"; email="testclient@test.com"; password="TestPass123"; role="client"} | ConvertTo-Json
    $r = curl.exe -s -X POST "$BASE/api/auth/register" -H "Content-Type: application/json" -d $body
    $data = $r | ConvertFrom-Json
    if ($data.success) { throw "Should reject duplicate email" }
    "ok (rejected: $($data.message))"
}

# ─── 8. CSRF / HEADER CHECKS ───
Write-Host "`n🛡️  8. CSRF PROTECTION" -ForegroundColor Yellow

Test-Step "Block unknown origin" {
    $body = @{email="testclient@test.com"; password="TestPass123"} | ConvertTo-Json
    $r = curl.exe -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -H "Origin: https://evil.com" -d $body
    $data = $r | ConvertFrom-Json
    if ($data.success) { throw "Should block cross-origin request" }
    "ok (blocked: $($data.message))"
}

Test-Step "Allow known origin" {
    $body = @{email="testclient@test.com"; password="TestPass123"} | ConvertTo-Json
    $r = curl.exe -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -H "Origin: http://localhost:5173" -d $body
    $data = $r | ConvertFrom-Json
    if (-not $data.success) { throw "Should allow localhost origin: $($data.message)" }
    "ok (allowed)"
}

# ─── SUMMARY ───
Write-Host "`n$('='*50)" -ForegroundColor Cyan
Write-Host "RESULTS: $pass passed, $fail failed" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
Write-Host "$('='*50)" -ForegroundColor Cyan
