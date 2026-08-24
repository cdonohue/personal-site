export const DESK_MAX = 18
export const DESK_RAISED = 14
export const CHAIR_EXIT = 114

export type Posture = 'seated' | 'standing'

export const STANDING_TAG = 'standing'

export const POSTURE_TAG: Record<Posture, string> = {
  standing: 'stand-up',
  seated: 'sit-down',
}

export const STARTLE_TAG: Record<Posture, string> = {
  seated: 'surprised',
  standing: 'surprised-standing',
}

export const CHAIR_SHOVE_TAG = 'shove'
