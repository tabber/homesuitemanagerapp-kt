export type FeatureTier = 'trial' | 'essential' | 'coming_soon'

export const FEATURES = {
  // Trial
  dashboard:              { tier: 'trial' as FeatureTier },
  basic_messaging:        { tier: 'trial' as FeatureTier },
  one_property:           { tier: 'trial' as FeatureTier },
  one_lease:              { tier: 'trial' as FeatureTier },
  view_maintenance:       { tier: 'trial' as FeatureTier },

  // Essential
  record_payments:        { tier: 'essential' as FeatureTier },
  payment_history:        { tier: 'essential' as FeatureTier },
  message_templates:      { tier: 'essential' as FeatureTier },
  multiple_properties:    { tier: 'essential' as FeatureTier },
  maintenance_management: { tier: 'essential' as FeatureTier },
  contractor_assignment:  { tier: 'essential' as FeatureTier },
  document_uploads:       { tier: 'essential' as FeatureTier },
  lease_pdf_download:     { tier: 'essential' as FeatureTier },
  data_export:            { tier: 'essential' as FeatureTier },

  // Coming Soon
  sms_notifications:      { tier: 'coming_soon' as FeatureTier },
  autopay:                { tier: 'coming_soon' as FeatureTier },
  interac_payments:       { tier: 'coming_soon' as FeatureTier },
  esignatures:            { tier: 'coming_soon' as FeatureTier },
  tax_export:             { tier: 'coming_soon' as FeatureTier },
}

export function hasFeatureAccess(
  feature: keyof typeof FEATURES,
  subscriptionStatus: 'trial' | 'essential' | 'expired',
  role?: string
): boolean {
  // Admins always have full access
  if (role === 'admin') return true
  
  const f = FEATURES[feature]
  if (f.tier === 'coming_soon') return false
  if (subscriptionStatus === 'expired') return false
  if (subscriptionStatus === 'essential') return true
  if (subscriptionStatus === 'trial') return f.tier === 'trial'
  return false
}
