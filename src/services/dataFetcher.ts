import cron from 'node-cron';
import { supabase } from '../config/supabase.js';

// This function will fetch data from a public API and upsert it into Supabase
export const syncHousingData = async () => {
  try {
    console.log("Starting background sync with government data...");

    // 1. Fetch from Public API (Example: HUD Fair Market Rent API)
    // You would replace this with the specific endpoint for your target region
    const response = await fetch('https://www.huduser.gov/hudapi/public/fmr?type=data');
    const data = await response.json();

    // 2. Map and Upsert into Supabase
    // We use upsert to avoid duplicate entries for the same property/area
    const { error } = await supabase
      .from('properties')
      .upsert(data.results.map((item: any) => ({
        external_id: item.id,
        price: item.rent_amount,
        neighborhood_id: 'YOUR_NEIGHBORHOOD_ID',
        status: 'available',
        last_updated: new Date().toISOString()
      })));

    if (error) throw error;

    console.log("Sync complete!");
  } catch (error) {
    console.error("Sync failed:", error);
  }
};

// 3. Schedule it to run every day at midnight
cron.schedule('0 0 * * *', () => {
  syncHousingData();
});