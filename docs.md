
/admin/auth (5) (authenticated)
post - /register
post - /login
post - /forget-password
post - /reset-paasword
post - /change-password

/admin/dashboard (1)
get - /dashboard

/admin/events (5)
post - /create
get - /all-events
patch - /update/:id
patch - /update-status/:id
delete - /delete/:id

/admin/execs (4)
post - /create
get - /all-exec
patch - /update/:id
delete - /delete/:id

/admin/announcement (4)
post - /create
get - /all
patch - /update/:id
delete - /delete/:id

/users (4) (unauthenticated)
get - /events
get - /event/:id
get - /exec
get - /announcement