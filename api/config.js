export default function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL || 'https://wihdoacgqbyxxeejoxsg.supabase.co',
    supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_h5mVvlW32Hd-9OVLpIODdA_ymCaNzPz',
    enabled: true
  });
}
