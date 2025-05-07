import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  userId: string | null
  email: string | null
  avatarUrl: string | null
  firstName: string | null
  lastName: string | null
  fullName: string | null
  isAuthenticated: boolean
  totalCredits: number
  remainingCredits: number
  subscriptionName: string | null
}

const loadInitialState = (): AuthState => {
  if (typeof window === 'undefined') return initialState

  const totalCredits = localStorage.getItem('totalCredits')
  const remainingCredits = localStorage.getItem('remainingCredits')

  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    userId: localStorage.getItem('userId'),
    email: localStorage.getItem('userEmail'),
    avatarUrl: localStorage.getItem('avatarUrl'),
    firstName: localStorage.getItem('firstName'),
    lastName: localStorage.getItem('lastName'),
    fullName: localStorage.getItem('fullName'),
    isAuthenticated: !!localStorage.getItem('accessToken'),
    totalCredits: totalCredits ? parseInt(totalCredits, 10) : 50,
    remainingCredits: remainingCredits ? parseInt(remainingCredits, 10) : 0,
    subscriptionName: localStorage.getItem('subscriptionName')
  }
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  userId: null,
  email: null,
  avatarUrl: null,
  firstName: null,
  lastName: null,
  fullName: null,
  isAuthenticated: false,
  totalCredits: 50,
  remainingCredits: 0,
  subscriptionName: 'Free'
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState(),
  reducers: {
    setCredentials: (state, action: PayloadAction<Omit<AuthState, 'isAuthenticated'>>) => {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.userId = action.payload.userId
      state.email = action.payload.email
      state.avatarUrl = action.payload.avatarUrl
      state.isAuthenticated = true

      // Update localStorage
      localStorage.setItem('accessToken', action.payload.accessToken!)
      localStorage.setItem('refreshToken', action.payload.refreshToken!)
      localStorage.setItem('userId', action.payload.userId!)
      localStorage.setItem('userEmail', action.payload.email!)
      localStorage.setItem('avatarUrl', action.payload.avatarUrl!)
    },
    setCredits: (
      state,
      action: PayloadAction<{
        totalCredits: number
        remainingCredits: number
        subscriptionName: string
        firstName?: string
        lastName?: string
        fullName?: string
      }>
    ) => {
      state.totalCredits = action.payload.totalCredits
      state.remainingCredits = action.payload.remainingCredits
      state.subscriptionName = action.payload.subscriptionName

      // Update name fields if provided
      if (action.payload.firstName !== undefined) {
        state.firstName = action.payload.firstName
        localStorage.setItem('firstName', action.payload.firstName)
      }

      if (action.payload.lastName !== undefined) {
        state.lastName = action.payload.lastName
        localStorage.setItem('lastName', action.payload.lastName)
      }

      if (action.payload.fullName !== undefined) {
        localStorage.setItem('fullName', action.payload.fullName)
      }

      // Update localStorage
      localStorage.setItem('totalCredits', action.payload.totalCredits.toString())
      localStorage.setItem('remainingCredits', action.payload.remainingCredits.toString())
      localStorage.setItem('subscriptionName', action.payload.subscriptionName)
    },
    setRemainingCredits: (state, action: PayloadAction<number>) => {
      state.remainingCredits = action.payload
      localStorage.setItem('remainingCredits', action.payload.toString())
    },
    setFirstName: (state, action: PayloadAction<string>) => {
      state.firstName = action.payload
      localStorage.setItem('firstName', action.payload)
    },
    setLastName: (state, action: PayloadAction<string>) => {
      state.lastName = action.payload
      localStorage.setItem('lastName', action.payload)
    },
    setFullName: (state, action: PayloadAction<string>) => {
      state.fullName = action.payload
      localStorage.setItem('fullName', action.payload)
    },

    logout: (state) => {
      state.accessToken = null
      state.refreshToken = null
      state.userId = null
      state.email = null
      state.isAuthenticated = false

      // Clear localStorage
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userId')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('totalCredits')
      localStorage.removeItem('remainingCredits')
      localStorage.removeItem('subscriptionName')
    }
  }
})

export const {
  setCredentials,
  setCredits,
  logout,
  setRemainingCredits,
  setFirstName,
  setLastName,
  setFullName
} = authSlice.actions
export default authSlice.reducer
