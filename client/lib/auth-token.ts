const AUTH_USERID = 'userId'
const AUTH_FULLNAME = 'fullName'
const AUTH_EMAIL = 'email'
const AUTH_TOKEN = 'token'

function clearAuthToken() {
    if (typeof window === "undefined") return

    localStorage.removeItem(AUTH_EMAIL)
    localStorage.removeItem(AUTH_FULLNAME)
    localStorage.removeItem(AUTH_USERID)
    localStorage.removeItem(AUTH_TOKEN)
}

export { AUTH_EMAIL, AUTH_USERID, AUTH_TOKEN, AUTH_FULLNAME, clearAuthToken }